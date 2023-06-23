import { CATEGORISER_USER, RECATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import LiteCategoriesPage from '../pages/liteCategories/liteCategories'
import { CASELOAD } from '../factory/caseload'
import CategoriserLandingPage from '../pages/categoriser/landing'
import moment from 'moment'
import LiteCategoriesConfirmedPage from '../pages/liteCategories/confirmed'
import { LiteCategoryDbRow } from '../db/queries'
import Page from '../pages/page'
import ErrorPage from '../pages/error/error'
import CategoriserHomePage from '../pages/categoriser/home'
import SupervisorDashboardHomePage from '../pages/dashboard/supervisor/home'
import dbSeeder, { dbSeederLiteCategory } from '../fixtures/db-seeder'
import { supervisorViewSeedData } from '../fixtures/liteCategoriser/supervisorView'

const SHORT_DATE_FORMAT = 'DD/MM/YYYY'

describe('Lite Categories', () => {
  let categoriserLandingPage: CategoriserLandingPage
  let liteCategoriesPage: LiteCategoriesPage
  let bookingId: number

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    bookingId = 12
  })

  describe('A categoriser user can create an assessment', () => {
    let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
    let sixMonthsFromNow: moment.Moment

    beforeEach(() => {
      cy.task('stubAgencyDetails', { agency: CASELOAD.LPI.id })
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })

      cy.task('stubUncategorised')
      sentenceStartDates = {
        B2345XY: new Date('2019-01-28'),
        B2345YZ: new Date('2019-01-31'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, bookingId],
        startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
      })

      cy.task('stubGetOffenderDetails', {
        bookingId,
        offenderNo: 'B2345YZ',
        youngOffender: false,
        indeterminateSentence: false,
      })

      cy.task('stubAgenciesPrison')

      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      cy.visit(`/${bookingId}`)

      categoriserLandingPage = CategoriserLandingPage.createForBookingId(bookingId)
      categoriserLandingPage.liteCategoriesButton().click()

      sixMonthsFromNow = moment().add(6, 'months').startOf('day')

      liteCategoriesPage = LiteCategoriesPage.createForBookingId(bookingId)
      liteCategoriesPage.validateWarningVisibility({ isVisible: false })
      liteCategoriesPage.getReAssessmentDate().should('have.value', sixMonthsFromNow.format(SHORT_DATE_FORMAT))
    })

    describe('Re-assessment date validation', () => {
      beforeEach(() => {
        liteCategoriesPage.setCategory('T')
        liteCategoriesPage.setAuthority('GOV')
        liteCategoriesPage.setRecommendedPlacement('BXI')
        liteCategoriesPage.setComment('comment text')
      })

      afterEach(() => {
        liteCategoriesPage.validateErrorSummaryMessages([
          { index: 0, href: '#nextReviewDate', text: 'Enter a valid date that is after today' },
        ])

        liteCategoriesPage.validateErrorMessages([
          { selector: '#nextReviewDate-error', text: 'Enter a valid date that is after today' },
        ])

        // ensure other field values are preserved
        liteCategoriesPage.getCategory().should('have.value', 'T')
        liteCategoriesPage.getAuthority().should('have.value', 'GOV')
        liteCategoriesPage.getRecommendedPlacement().should('have.value', 'BXI')
        liteCategoriesPage.getComment().should('have.text', 'comment text')
      })

      it('should require a re-assessment date', () => {
        liteCategoriesPage.clearReAssessmentDate()
        liteCategoriesPage.submitButton().click()
      })

      it('should require a valid date for the re-assessment date string', () => {
        liteCategoriesPage.setReAssessmentDate('INVALID')
        liteCategoriesPage.submitButton().click()
      })

      it('should require the re-assessment date is in the future', () => {
        liteCategoriesPage.setReAssessmentDate('21/11/2019')
        liteCategoriesPage.submitButton().click()
      })
    })

    describe('on valid submission', () => {
      beforeEach(() => {
        cy.task('stubCategorise', {
          bookingId,
          category: 'V',
          committee: 'RECP',
          nextReviewDate: sixMonthsFromNow.format('yyyy-MM-dd'),
          comment: 'comment',
          placementAgencyId: 'BXI',
          sequenceNumber: 1,
        })

        liteCategoriesPage.setCategory('V')
        liteCategoriesPage.setAuthority('RECP')
        liteCategoriesPage.setRecommendedPlacement('BXI')
        liteCategoriesPage.setComment('comment')
      })

      it('should handle a valid submission', () => {
        liteCategoriesPage.submitButton().click()

        LiteCategoriesConfirmedPage.createForBookingId(bookingId)

        cy.task('selectLiteCategoryTableDbRow', { bookingId }).then((result: { rows: LiteCategoryDbRow[] }) => {
          const data = result.rows[0]

          expect(data.sequence).eq(1)
          expect(data.category).eq('V')
          expect(data.offender_no).eq('B2345YZ')
          expect(data.prison_id).eq('LEI')
          expect(data.assessed_by).eq('CATEGORISER_USER')
          expect(data.assessment_committee).eq('RECP')
          expect(data.next_review_date).eq(sixMonthsFromNow.toISOString())
          expect(data.assessment_comment).eq('comment')
          expect(data.placement_prison_id).eq('BXI')
        })
      })

      it('should disable the submit button when pressed', () => {
        liteCategoriesPage.submitButton().should('have.attr', 'data-prevent-double-click', 'true')
        liteCategoriesPage.submitButton().should('not.have.attr', 'data-clicked', 'true')
        liteCategoriesPage.submitButton().should('not.have.attr', 'disabled', 'disabled')
        liteCategoriesPage.submitButton().should('not.have.attr', 'aria-disabled', 'true')
        liteCategoriesPage.submitButton().should('not.have.class', 'govuk-button--disabled')

        // a total hack to fake a form submission as every other attempt
        // immediately redirected before running the desired assertions
        cy.get('form').then(form => form[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))

        liteCategoriesPage.submitButton().should('have.attr', 'data-prevent-double-click', 'true')
        liteCategoriesPage.submitButton().should('have.attr', 'data-clicked', 'true')
        liteCategoriesPage.submitButton().should('have.attr', 'disabled', 'disabled')
        liteCategoriesPage.submitButton().should('have.attr', 'aria-disabled', 'true')
        liteCategoriesPage.submitButton().should('have.class', 'govuk-button--disabled')
      })

      it('should not allow a second categorisation to begin when a categorisation is already in progress', () => {
        liteCategoriesPage.submitButton().click()

        LiteCategoriesConfirmedPage.createForBookingId(bookingId)

        cy.visit(`/${bookingId}`)
        categoriserLandingPage.liteCategoriesButton().click()

        liteCategoriesPage.validateWarningVisibility({ isVisible: true })
        liteCategoriesPage.validateWarningText('A categorisation is already in progress for this person.')
      })

      it('should not be available for a re-categorisation', () => {
        liteCategoriesPage.submitButton().click()

        const liteCategoriesConfirmedPage = Page.verifyOnPage(LiteCategoriesConfirmedPage)
        liteCategoriesConfirmedPage.signOut().click()

        cy.stubLogin({
          user: RECATEGORISER_USER,
        })
        cy.signIn()

        cy.visit(`/tasklistRecat/${bookingId}`)

        const errorPage = Page.verifyOnPage(ErrorPage)
        errorPage.checkErrorMessage({
          heading: 'Error: This prisoner has an unapproved categorisation in the "Other categories" section',
          body: '',
        })
      })

      it('should display the expected status to the categoriser', () => {
        liteCategoriesPage.submitButton().click()

        cy.visit(CategoriserHomePage.baseUrl)

        const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
        categoriserHomePage.validateToDoTableData([
          ['OVERDUE', 'Hillmob, Ant', 'B2345YZ', '1607', 'Awaiting approval', '', 'PNOMIS'],
          ['OVERDUE', 'Pitstop, Penelope', 'B2345XY', '1604', 'Not categorised', '', 'OTHER'],
        ])
      })

      it('should prevent a further submission when the submit button is clicked', () => {
        liteCategoriesPage.submitButton().click()

        cy.visit(`/tasklist/${bookingId}`)

        const errorPage = Page.verifyOnPage(ErrorPage)
        errorPage.checkErrorMessage({
          heading: 'Error: This prisoner has an unapproved categorisation in the "Other categories" section',
          body: '',
        })
      })
    })
  })

  xdescribe('supervisor view', () => {
    let supervisorDashboardHomePage: SupervisorDashboardHomePage

    beforeEach(() => {
      dbSeederLiteCategory(supervisorViewSeedData)

      cy.task('stubAgenciesPrison')
      cy.task('stubGetOffenderDetails', {
        bookingId,
        offenderNo: 'B2345YZ',
        youngOffender: false,
        indeterminateSentence: false,
      })
      cy.task('stubUncategorisedAwaitingApproval')
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY'],
        bookingIds: [11],
        startDates: ['28/01/2019'],
      })

      cy.task('stubGetOffenderDetailsByOffenderNoList', {
        bookingId: [11, 12],
        offenderNumbers: ['B2345XY', 'B2345YZ'],
      })
      cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()

      supervisorDashboardHomePage = Page.verifyOnPage(SupervisorDashboardHomePage)
      supervisorDashboardHomePage.otherCategoriesTabLink().click()

      supervisorDashboardHomePage.validateOtherCategoriesTableData([
        ['23/06/2023', 'Dent, Jane', 'B2345YZ', 'CATEGORISER_USER', 'V', 'Approve'],
      ])

      cy.task('stubGetUserDetails', { user: CATEGORISER_USER, caseloadId: 'SYI' })

      supervisorDashboardHomePage.approveOtherCategoriesApprovalButton({ bookingId }).click()
    })

    it('should require an approval date', () => {})

    xit('should require a valid approval date string', () => {})

    xit('should require the approval date is in the future', () => {})

    xit('should handle a valid form submission', () => {})
  })

  xit('should remove an assessment if already approved in Nomis', () => {})
})
