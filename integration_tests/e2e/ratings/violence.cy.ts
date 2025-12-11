import CategoriserHomePage from '../../pages/categoriser/home'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment/moment'
import { CATEGORISER_USER, UserAccount } from '../../factory/user'
import Page from '../../pages/page'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import ViolencePage from '../../pages/form/ratings/violence'
import {
  makeTestNomisIncidentDto,
  makeTestNomisIncidentDtoResponse,
} from '../../../server/data/nomis/incidents/nomisIncident.dto.test-factory'
import { QUESTION_ANSWER_YES, SERIOUS_ASSAULT_QUESTIONS } from '../../../server/data/nomis/incidents/nomisIncident.dto'

describe('Violence', () => {
  let categoriserHomePage: CategoriserHomePage
  let violencePage: ViolencePage
  let taskListPage: TaskListPage
  let bookingId: number

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    bookingId = 12

    cy.task('stubUncategorised')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345YZ'],
      bookingIds: [12],
      startDates: [moment('2019-01-28').format('yyyy-MM-dd')],
    })
    cy.task('stubGetOffenderDetails', {
      bookingId,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345YZ',
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      band: 4,
    })
  })

  /**
   * Extracted to a separate step as some of the stubbing needs to differ between tests before
   * this point is reached.
   */
  const stubLoginAndBrowseToViolenceInputPage = ({ user }: { user: UserAccount } = { user: CATEGORISER_USER }) => {
    cy.stubLogin({
      user,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.violenceLink().click()
  }

  describe('form submission', () => {
    beforeEach(() => {
      cy.task('stubGetViperData', {
        prisonerNumber: 'B2345YZ',
        aboveThreshold: false,
      })
      cy.task('stubGetAssaultIncidents', {
        prisonerNumber: 'B2345YZ',
        assaultIncidents: [],
      })

      stubLoginAndBrowseToViolenceInputPage()

      violencePage = ViolencePage.createForBookingId(bookingId)

      violencePage.validateViolenceInfoExists({
        exists: true,
      })
      violencePage.validateExpectedViolenceInfo(
        'This person has not been reported as involved in any assaults in custody before',
      )
      violencePage.validateViolenceWarningExists({
        exists: false,
      })
      violencePage.validateHighRiskOfViolenceTextArea({
        isVisible: false,
      })
      violencePage.validateSeriousThreatTextArea({
        isVisible: false,
      })
    })

    describe('invalid form submission', () => {
      it('should show a validation error on empty form submission', () => {
        violencePage.saveAndReturnButton().click()

        violencePage.validateErrorSummaryMessages([
          { index: 0, href: '#highRiskOfViolence', text: 'High risk of violence: please select yes or no' },
          { index: 1, href: '#seriousThreat', text: 'Serious Threat: Please select yes or no' },
        ])

        violencePage.validateErrorMessages([
          { selector: '#highRiskOfViolence-error', text: 'Please select yes or no' },
          { selector: '#seriousThreat-error', text: 'Please select yes or no' },
        ])
      })

      it("should show a validation error for 'yes' radio selections that do not provide further details", () => {
        violencePage.selectHighRiskOfViolenceRadioButton('YES')
        violencePage.selectSeriousThreadRadioButton('YES')
        violencePage.saveAndReturnButton().click()

        violencePage.validateErrorSummaryMessages([
          { index: 0, href: '#highRiskOfViolenceText', text: 'Please enter high risk of violence details' },
          { index: 1, href: '#seriousThreatText', text: 'Please enter serious threat details' },
        ])

        violencePage.validateErrorMessages([
          { selector: '#highRiskOfViolenceText-error', text: 'Please enter details' },
          { selector: '#seriousThreatText-error', text: 'Please enter details' },
        ])
      })
    })

    describe('valid form submission', () => {
      it('should save and retrieve the form data', () => {
        violencePage.selectHighRiskOfViolenceRadioButton('YES')
        violencePage.setHighRiskOfViolenceText('Some risk text')

        violencePage.selectSeriousThreadRadioButton('YES')
        violencePage.setSeriousThreatText('Some threat text')

        violencePage.saveAndReturnButton().click()

        taskListPage.violenceLink().click()

        violencePage.validateHighRiskOfViolenceRadioButtons({
          selection: ['YES'],
          isChecked: true,
        })

        violencePage.validateSeriousThreatRadioButtons({
          selection: ['YES'],
          isChecked: true,
        })

        violencePage.validateHighRiskOfViolenceTextArea({
          isVisible: true,
          expectedText: 'Some risk text',
        })
        violencePage.validateSeriousThreatTextArea({
          isVisible: true,
          expectedText: 'Some threat text',
        })

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.STARTED.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              violenceRating: {
                seriousThreat: 'Yes',
                seriousThreatText: 'Some threat text',
                highRiskOfViolence: 'Yes',
                highRiskOfViolenceText: 'Some risk text',
              },
            },
          })
        })
      })
    })
  })

  describe('warning display', () => {
    it('should display the expected assault warning messages', () => {
      cy.task('stubGetViperData', {
        prisonerNumber: 'B2345YZ',
        aboveThreshold: false,
      })
      cy.task('stubGetAssaultIncidents', {
        prisonerNumber: 'B2345YZ',
        assaultIncidents: [
          makeTestNomisIncidentDto({
            incidentStatus: 'Something',
            reportTime: new Date().toDateString(),
            responses: [
              makeTestNomisIncidentDtoResponse({
                question: SERIOUS_ASSAULT_QUESTIONS[0],
                answer: QUESTION_ANSWER_YES,
              }),
            ],
          }),
          makeTestNomisIncidentDto({
            incidentStatus: 'Something',
            reportTime: new Date().toDateString(),
            responses: [
              makeTestNomisIncidentDtoResponse({
                question: SERIOUS_ASSAULT_QUESTIONS[0],
                answer: QUESTION_ANSWER_YES,
              }),
            ],
          }),
          makeTestNomisIncidentDto({
            incidentStatus: 'Something',
            reportTime: new Date().toDateString(),
            responses: [
              makeTestNomisIncidentDtoResponse({
                question: 'something',
                answer: 'No',
              }),
            ],
          }),
          makeTestNomisIncidentDto({
            incidentStatus: 'Something',
            reportTime: new Date().toDateString(),
            responses: [
              makeTestNomisIncidentDtoResponse({
                question: 'something',
                answer: 'No',
              }),
            ],
          }),
          makeTestNomisIncidentDto({
            incidentStatus: 'Something',
            reportTime: new Date().toDateString(),
            responses: [
              makeTestNomisIncidentDtoResponse({
                question: 'something',
                answer: 'No',
              }),
            ],
          }),
        ],
      })

      stubLoginAndBrowseToViolenceInputPage()

      violencePage = ViolencePage.createForBookingId(bookingId)

      violencePage.validateExpectedViolenceWarning(
        'This person has been reported as involved in 5 assaults in custody. In the past 12 months, there have been 2 serious assaults and 3 non-serious assaults. You should consider the dates and context of these assaults in your assessment.',
      )
      violencePage.validateViolenceInfoExists({ exists: false })
    })

    it('should display the safer custody lead flag', () => {
      cy.task('stubGetViperData', {
        prisonerNumber: 'B2345YZ',
        aboveThreshold: true,
      })
      cy.task('stubGetAssaultIncidents', {
        prisonerNumber: 'B2345YZ',
        assaultIncidents: [],
      })

      stubLoginAndBrowseToViolenceInputPage()

      violencePage = ViolencePage.createForBookingId(bookingId)

      violencePage.validateExpectedViolenceWarning('Please notify your safer custody lead about this prisoner')
      violencePage.validateViolenceInfoExists({ exists: false })
    })
  })
})
