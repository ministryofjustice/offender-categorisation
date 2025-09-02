import moment from 'moment/moment'
import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import { FormDbJson } from '../../fixtures/db-key-convertor'

describe('Previous Risk Assessments', () => {
  let recategoriserHomePage: RecategoriserHomePage
  let taskListPage: TasklistRecatPage
  let bookingId: number

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    bookingId = 12

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345YZ'],
      bookingIds: [12],
      startDates: [moment('2019-01-28').format('yyyy-MM-dd')],
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetOffenderDetails', {
      bookingId,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubGetSocProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      band: 4,
    })
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'XER',
    })
    cy.task('stubGetViolenceProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      veryHighRiskViolentOffender: true,
      notifySafetyCustodyLead: true,
      displayAssaults: false,
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
  })

  const stubLoginAndBrowseToPreviousRiskAssessmentsPage = () => {
    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TasklistRecatPage.createForBookingId(bookingId)
    taskListPage.prevRiskAssessmentInputButton().click()
  }

  describe('should record a valid form submission', () => {
    it('should record an oasys assessment answer', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()

      cy.get('#haveTheyHadRecentOasysAssessment').click()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.contains('h1', 'Check their OASys assessment')
      cy.get('input[name="oasysRelevantInfo"][value="Yes"]').check()
      cy.get('textarea[name="oasysInputText"]').type('Relevant oasys info')
      cy.contains('button', 'Save and return').click()
      cy.url().should('include', TasklistRecatPage.baseUrl)

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].form_response).to.deep.eq({
          recat: {
            oasysInput: { oasysRelevantInfo: 'Yes', oasysInputText: 'Relevant oasys info' },
          },
        })
      })
    })

    it('should record a bcst assessment answer', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()
      cy.get('input[name="haveTheyHadRecentOasysAssessment"][value="notRequired"]').check()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.contains('h1', 'Check their Basic Custody Screening Tool part 1 assessment')
      cy.get('input[name="bcstRelevantInfo"][value="Yes"]').check()
      cy.get('textarea[name="bcstInputText"]').type('Relevant bcst info')
      cy.contains('button', 'Save and return').click()
      cy.url().should('include', TasklistRecatPage.baseUrl)

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].form_response).to.deep.eq({
          recat: {
            bcstInput: { bcstRelevantInfo: 'Yes', bcstInputText: 'Relevant bcst info' },
          },
        })
      })
    })

    it('should allow the user to edit their answer', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()
      cy.get('input[name="haveTheyHadRecentOasysAssessment"][value="notRequired"]').check()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.contains('h1', 'Check their Basic Custody Screening Tool part 1 assessment')
      cy.get('input[name="bcstRelevantInfo"][value="Yes"]').check()
      cy.get('textarea[name="bcstInputText"]').type('Relevant bcst info')
      cy.contains('button', 'Save and return').click()
      cy.url().should('include', TasklistRecatPage.baseUrl)

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].form_response).to.deep.eq({
          recat: {
            bcstInput: { bcstRelevantInfo: 'Yes', bcstInputText: 'Relevant bcst info' },
          },
        })
      })

      taskListPage.prevRiskAssessmentInputButton().click()
      cy.get('input[name="haveTheyHadRecentOasysAssessment"][value="notRequired"]').should('be.checked')
      cy.get('#haveTheyHadRecentOasysAssessment').click()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.get('input[name="oasysRelevantInfo"][value="Yes"]').check()
      cy.get('textarea[name="oasysInputText"]').type('Relevant oasys info')
      cy.contains('button', 'Save and return').click()

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].form_response).to.deep.eq({
          recat: {
            oasysInput: { oasysRelevantInfo: 'Yes', oasysInputText: 'Relevant oasys info' },
          },
        })
      })
    })
  })

  describe('no assessment selected submissions', () => {
    it('should display a warning if the user needs to complete oasys for the nominal', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()
      cy.get('input[name="haveTheyHadRecentOasysAssessment"][value="no"]').check()
      cy.get('button[type="submit"]').contains('Continue').click()
      cy.contains('h1', 'You must complete an OASys for this person')
    })
  })

  describe('validation errors', () => {
    it('should display a validation error if no option selected on previous risk assessment page', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()
      cy.get('button[type="submit"]').contains('Continue').click()
      cy.contains('p.govuk-error-message', 'Please select an option')
    })

    it('should display a validation error if no option selected in the oasys assessment page', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()

      cy.get('#haveTheyHadRecentOasysAssessment').click()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.contains('button', 'Save and return').click()
      cy.contains(
        'p.govuk-error-message',
        'Select yes if there was any information in the assessment that is relevant to the recategorisation',
      )
    })

    it('should display a validation error if no option selected in the bcst assessment page', () => {
      stubLoginAndBrowseToPreviousRiskAssessmentsPage()
      cy.get('input[name="haveTheyHadRecentOasysAssessment"][value="notRequired"]').check()
      cy.get('button[type="submit"]').contains('Continue').click()

      cy.contains('button', 'Save and return').click()
      cy.contains(
        'p.govuk-error-message',
        'Select yes if there was any information in the review that is relevant to the recategorisation',
      )
    })
  })
})
