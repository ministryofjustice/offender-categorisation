import moment from 'moment/moment'
import CategoriserHomePage from '../../pages/categoriser/home'
import CategoriserLandingPage from '../../pages/categoriser/landing'
import NextReviewQuestionPage, { NextReviewChoice } from '../../pages/form/ratings/nextReviewQuestionPage'
import NextReviewConfirmationPage, { NextDateChoice } from '../../pages/form/ratings/nextReviewConfirmationPage'
import NextReviewEditingPage from '../../pages/form/ratings/nextReviewEditingPage'
import NextReviewStandalonePage from '../../pages/form/ratings/nextReviewStandalonePage'
import TaskListPage from '../../pages/taskList/taskList'
import { CATEGORISER_USER, SUPERVISOR_USER } from '../../factory/user'
import Page from '../../pages/page'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import approvedFixture from '../../fixtures/ratings/nextReview/approvedFixture'
import awaitingApprovalFixture from '../../fixtures/ratings/nextReview/awaitingApprovalFixture'
import supervisorChangeFixture from '../../fixtures/ratings/nextReview/supervisorChangeFixture'
import dbSeeder from '../../fixtures/db-seeder'
import { NextReviewChangeHistoryDbRow } from '../../db/queries'
import ErrorPage from '../../pages/error/error'
import SupervisorLandingPage from '../../pages/supervisor/landing'

const EXPECTED_DATE_FORMAT_FRONT_END = 'D/M/yyyy'
const EXPECTED_DATE_FORMAT_BACK_END = 'yyyy-MM-DD'

describe('Next Review', () => {
  let categoriserHomePage: CategoriserHomePage
  let categoriserLandingPage: CategoriserLandingPage
  let nextReviewQuestionPage: NextReviewQuestionPage
  let nextReviewConfirmationPage: NextReviewConfirmationPage
  let nextReviewEditingPage: NextReviewEditingPage
  let nextReviewStandalonePage: NextReviewStandalonePage
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
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [moment().format(EXPECTED_DATE_FORMAT_BACK_END), moment().format(EXPECTED_DATE_FORMAT_BACK_END)],
    })
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

    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      increasedRisk: true,
      notifyRegionalCTLead: false,
    })

    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
  })

  describe('step 1 - when should they next be reviewed?', () => {
    beforeEach(() => {
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId)

      taskListPage = TaskListPage.createForBookingId(bookingId)
      taskListPage.nextReviewDateButton().click()

      nextReviewQuestionPage = NextReviewQuestionPage.createForBookingId(bookingId)
      nextReviewQuestionPage.checkPrisonerReviewGuidance()
      nextReviewQuestionPage.checkConditionalReleaseDateInsetText('2020-02-02')
    })

    describe('invalid', () => {
      it('should show a validation error on empty form submission', () => {
        nextReviewQuestionPage.continueButton().click()

        nextReviewQuestionPage.validateErrorSummaryMessages([
          { index: 0, href: '#nextDateChoice', text: 'Please select a choice' },
        ])

        nextReviewQuestionPage.validateErrorMessages([
          { selector: '#nextDateChoice-error', text: 'Please select a choice' },
        ])
      })
    })

    describe('valid', () => {
      // -- spacer
      const nextReviewDateOptions: { selectedTextValue: NextReviewChoice; nextDateChoice: NextDateChoice }[] = [
        { selectedTextValue: 'IN_SIX_MONTHS', nextDateChoice: '6' },
        { selectedTextValue: 'IN_TWELVE_MONTHS', nextDateChoice: '12' },
        { selectedTextValue: 'ENTER_A_SPECIFIC_DATE', nextDateChoice: 'SPECIFIC' },
      ]
      nextReviewDateOptions.forEach(({ selectedTextValue, nextDateChoice }) => {
        it(`should be valid when selecting '${selectedTextValue}'`, () => {
          nextReviewQuestionPage.selectNextReviewRadioButton(selectedTextValue as NextReviewChoice)

          nextReviewQuestionPage.continueButton().click()

          nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(12, nextDateChoice)
          nextReviewConfirmationPage.checkOnPage()
          nextReviewConfirmationPage.checkPageUrl(NextReviewConfirmationPage.baseUrl)
        })
      })
    })
  })

  describe('step 2 - Confirm the date they should be reviewed by', () => {
    beforeEach(() => {
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId)

      taskListPage = TaskListPage.createForBookingId(bookingId)
      taskListPage.nextReviewDateButton().click()

      nextReviewQuestionPage = NextReviewQuestionPage.createForBookingId(bookingId)
      nextReviewQuestionPage.checkPrisonerReviewGuidance()
      nextReviewQuestionPage.checkConditionalReleaseDateInsetText('2020-02-02')
    })

    describe('invalid', () => {
      beforeEach(() => {
        nextReviewQuestionPage.selectNextReviewRadioButton('IN_SIX_MONTHS' as NextReviewChoice)
        nextReviewQuestionPage.continueButton().click()

        nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(12, '6')
        nextReviewConfirmationPage.checkPrisonerReviewGuidance()
        nextReviewConfirmationPage.checkConditionalReleaseDateInsetText('2020-02-02')
      })

      it('should show a validation error if given an empty review date', () => {
        nextReviewConfirmationPage.clearReviewDateInputValue()
        nextReviewConfirmationPage.saveAndReturnButton().click()

        nextReviewConfirmationPage.validateErrorSummaryMessages([
          { index: 0, href: '#date', text: 'The review date must be a real date' },
        ])

        nextReviewConfirmationPage.validateErrorMessages([
          { selector: '#reviewDate-error', text: 'The review date must be a real date' },
        ])
      })

      // -- spacer for prettier
      ;[
        { date: '1/1/1', expectedError: 'The review date must be a real date' },
        {
          date: moment().subtract(1, 'days').format(EXPECTED_DATE_FORMAT_FRONT_END),
          expectedError: 'The review date must be today or in the future',
        },
        {
          date: moment().add(1, 'year').add(1, 'day').format(EXPECTED_DATE_FORMAT_FRONT_END),
          expectedError: 'The date that they are reviewed must be within the next 12 months',
        },
      ].forEach(({ date, expectedError }) => {
        it(`should show a validation error if given an invalid date: ${date}`, () => {
          nextReviewConfirmationPage.setReviewDateInputValue(date)
          nextReviewConfirmationPage.saveAndReturnButton().click()

          nextReviewConfirmationPage.validateErrorSummaryMessages([{ index: 0, href: '#date', text: expectedError }])

          nextReviewConfirmationPage.validateErrorMessages([{ selector: '#reviewDate-error', text: expectedError }])
        })
      })
    })

    describe('valid', () => {
      let expectedReviewDate: string

      beforeEach(() => {
        expectedReviewDate = undefined
      })

      afterEach(() => {
        nextReviewConfirmationPage.saveAndReturnButton().click()

        taskListPage.nextReviewDateButton().click()

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.STARTED.name)
          expect(result.rows[0].cat_type).to.eq(CATEGORISATION_TYPE.INITIAL)
          expect(result.rows[0].user_id).to.eq(CATEGORISER_USER.username)
          expect(result.rows[0].assigned_user_id).to.eq(CATEGORISER_USER.username)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              nextReviewDate: {
                date: expectedReviewDate,
                indeterminate: 'false',
              },
            },
          })
        })

        nextReviewEditingPage = NextReviewEditingPage.createForBookingId(bookingId)
        nextReviewEditingPage.getChangeThisDateLink(NextReviewQuestionPage.baseUrl).click()

        nextReviewQuestionPage.validateReviewDateRadioButton({
          selection: ['IN_SIX_MONTHS', 'IN_TWELVE_MONTHS', 'ENTER_A_SPECIFIC_DATE'],
          isChecked: false,
        })
      })

      it(`should be valid when selecting six months`, () => {
        nextReviewQuestionPage.selectNextReviewRadioButton('IN_SIX_MONTHS' as NextReviewChoice)
        nextReviewQuestionPage.continueButton().click()

        expectedReviewDate = moment().add(6, 'months').format(EXPECTED_DATE_FORMAT_FRONT_END)

        nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(12, '6')
        nextReviewConfirmationPage.validateReviewDateInputValue(expectedReviewDate)
      })

      it(`should be valid when selecting twelve months`, () => {
        nextReviewQuestionPage.selectNextReviewRadioButton('IN_TWELVE_MONTHS' as NextReviewChoice)
        nextReviewQuestionPage.continueButton().click()

        expectedReviewDate = moment().add(12, 'months').format(EXPECTED_DATE_FORMAT_FRONT_END)

        nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(12, '12')
        nextReviewConfirmationPage.validateReviewDateInputValue(expectedReviewDate)
      })

      it(`should be valid when selecting specific date`, () => {
        nextReviewQuestionPage.selectNextReviewRadioButton('ENTER_A_SPECIFIC_DATE' as NextReviewChoice)
        nextReviewQuestionPage.continueButton().click()

        expectedReviewDate = moment().add(1, 'year').subtract(1, 'day').format(EXPECTED_DATE_FORMAT_FRONT_END)

        nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(12, 'SPECIFIC')
        nextReviewConfirmationPage.validateReviewDateInputValue('')
        nextReviewConfirmationPage.setReviewDateInputValue(expectedReviewDate)
      })
    })
  })

  describe('Next Review Date - Standalone Page - arrives from DPS categorisation link', () => {
    describe('categorisation is already in progress', () => {
      describe('form submission validation', () => {
        beforeEach(() => {
          cy.stubLogin({
            user: CATEGORISER_USER,
          })
          cy.signIn()

          dbSeeder(approvedFixture)

          cy.visit(`/${bookingId}`)

          categoriserLandingPage = CategoriserLandingPage.createForBookingId(bookingId)
          categoriserLandingPage.changeReviewDateButton().click()

          nextReviewStandalonePage = NextReviewStandalonePage.createForBookingId(bookingId)
          nextReviewStandalonePage.checkCurrentReviewInsetText('2020-01-16')
          nextReviewStandalonePage.checkPrisonerReviewGuidance()
          nextReviewStandalonePage.checkConditionalReleaseDateInsetText('2020-02-02')
        })

        it('should reject an empty form submission', () => {
          nextReviewStandalonePage.clearNewReviewDateInput()
          nextReviewStandalonePage.clearNewReviewReasonTextInput()
          nextReviewStandalonePage.submitButton().click()

          nextReviewStandalonePage.validateErrorSummaryMessages([
            { index: 0, href: '#date', text: 'The review date must be a real date' },
            { index: 1, href: '#reason', text: 'Enter reason for date change' },
          ])
          nextReviewStandalonePage.validateErrorMessages([
            { selector: '#reviewDate-error', text: 'The review date must be a real date' },
            { selector: '#reason-error', text: 'Enter reason for date change' },
          ])
        })

        /**
         * Note: reason field can be 50_000 chars. Cypress dies if trying to test that.
         */
        it('should reject an invalid review date', () => {
          nextReviewStandalonePage.clearNewReviewDateInput()
          nextReviewStandalonePage.clearNewReviewReasonTextInput()

          nextReviewStandalonePage.setNewReviewDateInput(
            moment().add(1, 'year').add(1, 'day').format(EXPECTED_DATE_FORMAT_FRONT_END),
          )
          nextReviewStandalonePage.submitButton().click()

          nextReviewStandalonePage.validateErrorSummaryMessages([
            { index: 0, href: '#date', text: 'The date that they are reviewed must be within the next 12 months' },
            { index: 1, href: '#reason', text: 'Enter reason for date change' },
          ])
          nextReviewStandalonePage.validateErrorMessages([
            {
              selector: '#reviewDate-error',
              text: 'The date that they are reviewed must be within the next 12 months',
            },
            { selector: '#reason-error', text: 'Enter reason for date change' },
          ])
        })

        it('should accept a valid form submission', () => {
          const newReviewDate = moment().add(3, 'months').startOf('day')
          const newReviewReason = 'A test reason'

          cy.task('stubUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

          nextReviewStandalonePage.setNewReviewDateInput(newReviewDate.format(EXPECTED_DATE_FORMAT_FRONT_END))
          nextReviewStandalonePage.setNewReviewReasonTextInput(newReviewReason)
          nextReviewStandalonePage.submitButton().click()

          categoriserLandingPage.validateChangeHistoryTableData([
            [newReviewDate.format('D MMMM yyyy'), 'A test reason'],
          ])

          cy.task('verifyUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response.ratings.nextReviewDate).to.deep.eq({
              date: '14/12/2019',
            })
          })

          cy.task('selectNextReviewChangeHistoryTableDbRow', { offenderNo: 'B2345YZ' }).then(
            (result: { rows: NextReviewChangeHistoryDbRow[] }) => {
              expect(result.rows[0].reason).to.eq('A test reason')
              expect(result.rows[0].next_review_date).to.eq(newReviewDate.toISOString(false))
              expect(result.rows[0].changed_by).to.eq(CATEGORISER_USER.username)
              expect(result.rows.length).to.eq(1)
            },
          )
        })
      })

      describe('the nextReviewDate Standalone page saves details correctly', () => {
        it('should require a user to use the task list to change the date', () => {
          dbSeeder(awaitingApprovalFixture)

          cy.stubLogin({
            user: CATEGORISER_USER,
          })
          cy.signIn()

          cy.visit(`/${bookingId}`)

          categoriserLandingPage = CategoriserLandingPage.createForBookingId(bookingId)
          categoriserLandingPage.validateNextReviewDateButtonExists({ exists: false })

          cy.visit(`/form/nextReviewDate/nextReviewDateStandalone/${bookingId}`)
          const errorPage = new ErrorPage()
          errorPage.checkErrorMessage({
            heading: 'Categorisation is in progress: please use the tasklist to change date',
            body: '',
          })
        })

        it('should allow a supervisor to make a change', () => {
          dbSeeder(supervisorChangeFixture)

          cy.task('stubUncategorisedAwaitingApproval')
          cy.stubLogin({ user: SUPERVISOR_USER })
          cy.signIn()
          cy.visit(`/${bookingId}`)

          const supervisorLandingPage = SupervisorLandingPage.createForBookingId(bookingId)
          supervisorLandingPage.changeReviewDateButton().click()

          nextReviewStandalonePage = NextReviewStandalonePage.createForBookingId(bookingId)
          nextReviewStandalonePage.checkCurrentReviewInsetText('2020-01-16')
          nextReviewStandalonePage.checkPrisonerReviewGuidance()
          nextReviewStandalonePage.checkConditionalReleaseDateInsetText('2020-02-02')

          const newReviewDate = moment().add(1, 'months').add(4, 'days').startOf('day')
          const newReviewReason = 'Another test reason'

          cy.task('stubUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

          nextReviewStandalonePage.setNewReviewDateInput(newReviewDate.format(EXPECTED_DATE_FORMAT_FRONT_END))
          nextReviewStandalonePage.setNewReviewReasonTextInput(newReviewReason)
          nextReviewStandalonePage.submitButton().click()

          supervisorLandingPage.validateChangeHistoryTableData([
            [newReviewDate.format('D MMMM yyyy'), 'Another test reason'],
          ])

          cy.task('verifyUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response.ratings.nextReviewDate).to.deep.eq({
              date: '14/12/2019',
            })
          })

          cy.task('selectNextReviewChangeHistoryTableDbRow', { offenderNo: 'B2345YZ' }).then(
            (result: { rows: NextReviewChangeHistoryDbRow[] }) => {
              expect(result.rows[0].reason).to.eq('Another test reason')
              expect(result.rows[0].next_review_date).to.eq(newReviewDate.toISOString(false))
              expect(result.rows[0].changed_by).to.eq(SUPERVISOR_USER.username)
              expect(result.rows.length).to.eq(1)
            },
          )
        })
      })
    })

    describe('categorisation is not in progress', () => {
      beforeEach(() => {
        cy.stubLogin({
          user: CATEGORISER_USER,
        })
        cy.signIn()

        cy.visit(`/${bookingId}`)

        categoriserLandingPage = CategoriserLandingPage.createForBookingId(bookingId)
        categoriserLandingPage.changeReviewDateButton().click()

        nextReviewStandalonePage = NextReviewStandalonePage.createForBookingId(bookingId)
        nextReviewStandalonePage.checkCurrentReviewInsetText('2020-01-16')
        nextReviewStandalonePage.checkPrisonerReviewGuidance()
      })

      it('should reject an empty form submission', () => {
        nextReviewStandalonePage.clearNewReviewDateInput()
        nextReviewStandalonePage.clearNewReviewReasonTextInput()
        nextReviewStandalonePage.submitButton().click()

        nextReviewStandalonePage.validateErrorSummaryMessages([
          { index: 0, href: '#date', text: 'The review date must be a real date' },
          { index: 1, href: '#reason', text: 'Enter reason for date change' },
        ])
        nextReviewStandalonePage.validateErrorMessages([
          { selector: '#reviewDate-error', text: 'The review date must be a real date' },
          { selector: '#reason-error', text: 'Enter reason for date change' },
        ])
      })

      /**
       * Note: reason field can be 50_000 chars. Cypress dies if trying to test that.
       */
      it('should reject an invalid review date', () => {
        nextReviewStandalonePage.clearNewReviewDateInput()
        nextReviewStandalonePage.clearNewReviewReasonTextInput()

        nextReviewStandalonePage.setNewReviewDateInput(moment().add(2, 'year').format(EXPECTED_DATE_FORMAT_FRONT_END))
        nextReviewStandalonePage.submitButton().click()

        nextReviewStandalonePage.validateErrorSummaryMessages([
          { index: 0, href: '#date', text: 'The date that they are reviewed must be within the next 12 months' },
          { index: 1, href: '#reason', text: 'Enter reason for date change' },
        ])
        nextReviewStandalonePage.validateErrorMessages([
          {
            selector: '#reviewDate-error',
            text: 'The date that they are reviewed must be within the next 12 months',
          },
          { selector: '#reason-error', text: 'Enter reason for date change' },
        ])
      })

      it('should accept a valid form submission', () => {
        const newReviewDate = moment().add(2, 'months').startOf('day')
        const newReviewReason = 'A test reason'

        cy.task('stubUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

        nextReviewStandalonePage.setNewReviewDateInput(newReviewDate.format(EXPECTED_DATE_FORMAT_FRONT_END))
        nextReviewStandalonePage.setNewReviewReasonTextInput(newReviewReason)
        nextReviewStandalonePage.submitButton().click()

        categoriserLandingPage.validateChangeHistoryTableData([[newReviewDate.format('D MMMM yyyy'), 'A test reason']])

        cy.task('verifyUpdateNextReviewDate', { date: newReviewDate.format(EXPECTED_DATE_FORMAT_BACK_END) })

        // no form data exists
        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0]).to.eq(undefined)
        })

        cy.task('selectNextReviewChangeHistoryTableDbRow', { offenderNo: 'B2345YZ' }).then(
          (result: { rows: NextReviewChangeHistoryDbRow[] }) => {
            expect(result.rows[0].reason).to.eq('A test reason')
            expect(result.rows[0].next_review_date).to.eq(newReviewDate.toISOString(false))
            expect(result.rows[0].changed_by).to.eq(CATEGORISER_USER.username)
            expect(result.rows.length).to.eq(1)
          },
        )
      })
    })
  })
})
