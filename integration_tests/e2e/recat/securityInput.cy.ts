import moment from 'moment/moment'
import { CATEGORISER_USER, RECATEGORISER_USER, SECURITY_USER } from '../../factory/user'
import Page from '../../pages/page'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import CatType from '../../../server/utils/catTypeEnum'
import SecurityHomePage from '../../pages/security/home'
import SecurityReviewPage from '../../pages/form/security/review'
import CategoriserSecurityBackPage from '../../pages/form/ratings/categoriserSecurityBackPage'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import RecategoriserSecurityInputPage from '../../pages/form/recat/security/recategoriserSecurityInputPage'
import RecategoriserSecurityBackPage from '../../pages/form/recat/security/recategoriserSecurityBackPage'

describe('Security Input', () => {
  let recategoriserHomePage: RecategoriserHomePage
  let recategoriserSecurityInputPage: RecategoriserSecurityInputPage
  let taskListPage: TasklistRecatPage
  let bookingId: number

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('deleteRowsFromSecurityReferral')
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
    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345YZ',
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
    cy.task('stubGetViperData', {
      prisonerNumber: 'B2345YZ',
      aboveThreshold: true,
    })
    cy.task('stubGetAssaultIncidents', {
      prisonerNumber: 'B2345YZ',
      assaultIncidents: [],
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
  })

  const stubLoginAndBrowseToRecategoriserSecurityInputPage = () => {
    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TasklistRecatPage.createForBookingId(bookingId)
    taskListPage.securityLink().click()
  }

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
      stubLoginAndBrowseToRecategoriserSecurityInputPage()

      recategoriserSecurityInputPage = RecategoriserSecurityInputPage.createForBookingId(bookingId)
      recategoriserSecurityInputPage.submitButton().click()

      recategoriserSecurityInputPage.validateErrorSummaryMessages([
        { index: 0, href: '#securityNoteNeeded', text: 'Select yes if you want to include a note to security' },
      ])

      recategoriserSecurityInputPage.validateErrorMessages([
        { selector: '#securityNoteNeeded-error', text: 'Select yes if you want to include a note to security' },
      ])
    })

    describe('it should record a valid form submission', () => {
      it("should record a 'no' decision", () => {
        stubLoginAndBrowseToRecategoriserSecurityInputPage()

        recategoriserSecurityInputPage = RecategoriserSecurityInputPage.createForBookingId(bookingId)
        recategoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
        recategoriserSecurityInputPage.validateSecurityInputTextBox({ isVisible: false })
        recategoriserSecurityInputPage.submitButton().click()

        taskListPage.validateSecurityReferralDate(new Date())

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].cat_type).to.eq(CatType.RECAT.name)
          expect(result.rows[0].status).to.eq(Status.SECURITY_MANUAL.name)
          expect(result.rows[0].form_response).to.deep.eq({
            recat: {
              securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
            },
          })
        })

        cy.task('stubSubmitSecurityReview', { bookingId })
        cy.task('stubGetStaffDetailsByUsernameList', {
          usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
        })
        cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345YZ'] })

        cy.stubLogin({
          user: SECURITY_USER,
        })
        cy.signIn()

        const securityHomePage = Page.verifyOnPage(SecurityHomePage)
        securityHomePage.validateCategorisationReferralsToDoTableColumnData([
          {
            columnName: 'Name and prison number',
            expectedValues: ['Clark, FrankB2345YZ'],
          },
          {
            columnName: 'Referred by',
            expectedValues: [RECATEGORISER_USER.username],
          },
        ])
        securityHomePage.getStartButton({ bookingId }).click()

        const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
        securityReviewPage.validateHeaderRecatNote({ isVisible: true, expectedText: 'Note from categoriser' })
        securityReviewPage.validateNoParagraphRecatNote()
      })

      it('should display error if no security input text is given', () => {
        stubLoginAndBrowseToRecategoriserSecurityInputPage()

        recategoriserSecurityInputPage = RecategoriserSecurityInputPage.createForBookingId(bookingId)
        recategoriserSecurityInputPage.selectSecurityInputRadioButton('YES')
        recategoriserSecurityInputPage.submitButton().click()

        recategoriserSecurityInputPage.validateErrorSummaryMessages([
          { index: 0, href: '#securityInputNeededText', text: 'Enter a note' },
        ])

        recategoriserSecurityInputPage.validateErrorMessages([
          { selector: '#securityInputNeededText-error', text: 'Enter a note' },
        ])
      })

      describe("it should record a 'yes' decision", () => {
        beforeEach(() => {
          stubLoginAndBrowseToRecategoriserSecurityInputPage()

          recategoriserSecurityInputPage = RecategoriserSecurityInputPage.createForBookingId(bookingId)
          recategoriserSecurityInputPage.selectSecurityInputRadioButton('YES')
          recategoriserSecurityInputPage.setSecurityInputText('Some security input text')
          recategoriserSecurityInputPage.submitButton().click()
        })

        it('should display the security referral information on the task list', () => {
          taskListPage.validateSecurityReferralDate(new Date())
        })

        it('should allow a security user to complete their assessment', () => {
          cy.task('stubSubmitSecurityReview', { bookingId })
          cy.task('stubGetStaffDetailsByUsernameList', {
            usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
          })
          cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345YZ'] })

          cy.stubLogin({
            user: SECURITY_USER,
          })
          cy.signIn()

          const securityHomePage = Page.verifyOnPage(SecurityHomePage)
          securityHomePage.validateCategorisationReferralsToDoTableColumnData([
            {
              columnName: 'Name and prison number',
              expectedValues: ['Clark, FrankB2345YZ'],
            },
            {
              columnName: 'Referred by',
              expectedValues: [RECATEGORISER_USER.username],
            },
          ])
          securityHomePage.getStartButton({ bookingId }).click()

          const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
          securityReviewPage.validateHeaderRecatNote({ isVisible: true, expectedText: 'Note from categoriser' })
          const testSecurityText = 'Some security input text'
          securityReviewPage.validateParagraphRecatNote({ isVisible: true, expectedText: testSecurityText })
          securityReviewPage.setSecurityInformationText(testSecurityText)
          cy.task('updateFormRecord', {
            bookingId,
            status: Status.SECURITY_BACK.name,
            formResponse: { security: { review: { securityReview: testSecurityText } } },
          })
          securityReviewPage.saveAndSubmitButton().click()

          securityHomePage.validateNoReferralsToReview()
        })

        describe('recategoriser journey after security approval', () => {
          let securityBackPage: RecategoriserSecurityBackPage

          it('should display security input to recategoriser', () => {
            cy.task('stubSubmitSecurityReview', { bookingId })
            cy.task('stubGetStaffDetailsByUsernameList', {
              usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
            })
            cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345YZ'] })

            taskListPage.signOut().click()

            cy.stubLogin({
              user: SECURITY_USER,
            })
            cy.signIn()

            const securityHomePage = Page.verifyOnPage(SecurityHomePage)
            securityHomePage.getStartButton({ bookingId }).click()
            const testSecurityText = 'Some security input text'

            const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
            securityReviewPage.setSecurityInformationText('security info text')
            cy.task('updateFormRecord', {
              bookingId,
              status: Status.SECURITY_BACK.name,
              formResponse: { security: { review: { securityReview: `${testSecurityText} security info text` } } },
            })
            securityReviewPage.saveAndSubmitButton().click()

            cy.stubLogin({
              user: RECATEGORISER_USER,
            })
            cy.signIn()

            recategoriserHomePage.selectPrisonerWithBookingId(bookingId, 'Edit')

            taskListPage.securityLink().click()

            securityBackPage = CategoriserSecurityBackPage.createForBookingId(bookingId)
            securityBackPage.validateNoteFromSecurity(['Some security input text', 'security info text'])
          })
        })
      })
    })
  })
})
