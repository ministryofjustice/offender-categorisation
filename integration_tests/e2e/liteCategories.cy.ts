import { CATEGORISER_USER, RECATEGORISER_USER, SUPERVISOR_USER } from '../factory/user'
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
import { dbSeederLiteCategory } from '../fixtures/db-seeder'
import { supervisorViewSeedData } from '../fixtures/liteCategoriser/supervisorView'
import LiteCategoriesApprovalPage from '../pages/liteCategories/approval'
import { unapprovedLiteCategorisation } from '../fixtures/liteCategoriser/unapprovedLiteCategorisation'
import SupervisorLiteListPage from '../pages/liteCategories/approveList'
import LiteCategoriesAlreadyApprovedPage from '../pages/liteCategories/alreadyApproved'
import { calculateOverdueText } from '../support/utilities'

const SHORT_DATE_FORMAT = 'D/M/YYYY'

describe('Lite Categories', () => {
  let categoriserLandingPage: CategoriserLandingPage
  let liteCategoriesPage: LiteCategoriesPage
  let bookingId: number
  let sixMonthsFromNow: moment.Moment

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    bookingId = 12
    sixMonthsFromNow = moment().add(6, 'months').startOf('day')
  })

  describe('A categoriser user can create an assessment', () => {
    let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>

    beforeEach(() => {
      cy.task('stubAgencyDetails', { agency: CASELOAD.LPI.id })
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })

      cy.task('stubUncategorised')
      sentenceStartDates = {
        B2345XY: new Date('2019-01-31'),
        B2345YZ: new Date('2019-01-28'),
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

      liteCategoriesPage = LiteCategoriesPage.createForBookingId(bookingId)
      liteCategoriesPage.validateWarningVisibility({ isVisible: false })
      liteCategoriesPage.getReAssessmentDate().should('have.value', sixMonthsFromNow.format(SHORT_DATE_FORMAT))
    })

    it('should have the expected lite categorisation options', () => {
      liteCategoriesPage.validateAvailableCategoryOptions()
    })

    describe('Re-assessment date validation', () => {
      beforeEach(() => {
        liteCategoriesPage.setCategory('A')
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
        liteCategoriesPage.getCategory().should('have.value', 'A')
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

        // a total hack to fake a form submission as every other attempt
        // immediately redirected before running the desired assertions
        cy.get('form').then(form => form[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))

        liteCategoriesPage.submitButton().should('have.attr', 'data-prevent-double-click', 'true')
        liteCategoriesPage.submitButton().should('have.attr', 'data-clicked', 'true')
        liteCategoriesPage.submitButton().should('have.attr', 'disabled', 'disabled')
        liteCategoriesPage.submitButton().should('have.attr', 'aria-disabled', 'true')
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
          [
            calculateOverdueText(sentenceStartDates.B2345YZ),
            'Pitstop, PenelopeB2345XY',
            moment().diff(moment(sentenceStartDates['B2345YZ']).startOf('day'), 'days').toString(),
            'Not categorised',
            'Engelbert Humperdinck',
            'OTHER',
          ],
          [
            calculateOverdueText(sentenceStartDates.B2345XY),
            'Hillmob, AntB2345YZ',
            moment().diff(moment(sentenceStartDates['B2345XY']).startOf('day'), 'days').toString(),
            'Awaiting approval',
            'Engelbert Humperdinck',
            'PNOMIS',
          ],
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

  describe('supervisor view', () => {
    let supervisorDashboardHomePage: SupervisorDashboardHomePage
    let liteApprovalPage: LiteCategoriesApprovalPage

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
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345YZ'],
        bookingIds: [12],
        startDates: ['2019-01-31'],
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
        ['23/06/2023', 'Dent, JaneB2345YZ', 'CATEGORISER_USER', 'V', 'Approve'],
      ])

      cy.task('stubGetUserDetails', { user: CATEGORISER_USER, caseloadId: 'SYI' })

      supervisorDashboardHomePage.approveOtherCategoriesApprovalButton({ bookingId }).click()

      liteApprovalPage = LiteCategoriesApprovalPage.createForBookingId(bookingId)
      liteApprovalPage.getApprovalDate().should('have.value', moment().format(SHORT_DATE_FORMAT))
      liteApprovalPage.getNextReviewDate().should('have.value', sixMonthsFromNow.format(SHORT_DATE_FORMAT))
    })

    it('should have the expected lite categorisation approved category options', () => {
      liteApprovalPage.validateAvailableApprovedCategoryOptions()
    })

    describe('field validations', () => {
      describe('approval date', () => {
        afterEach(() => {
          liteApprovalPage.validateErrorSummaryMessages([
            { href: '#approvedDate', index: 0, text: 'Enter a valid date that is today or earlier' },
          ])
          liteApprovalPage.validateErrorMessages([{ selector: '#approvedDate-error', text: 'Enter a valid date' }])
        })

        it('should require an approval date', () => {
          liteApprovalPage.clearApprovalDate()
          liteApprovalPage.submitButton().click()
        })

        it('should require a valid approval date string', () => {
          liteApprovalPage.setApprovalDate('some invalid value')
          liteApprovalPage.submitButton().click()
        })

        it('should require the approval date that is today or earlier', () => {
          liteApprovalPage.setApprovalDate(moment().add(1, 'day').format(SHORT_DATE_FORMAT))
          liteApprovalPage.submitButton().click()
        })
      })

      describe('next review date', () => {
        afterEach(() => {
          liteApprovalPage.validateErrorSummaryMessages([
            { href: '#nextReviewDate', index: 0, text: 'Enter a valid date that is after today' },
          ])
          liteApprovalPage.validateErrorMessages([
            { selector: '#nextReviewDate-error', text: 'Enter a valid future date' },
          ])
        })

        it('should require a next review date', () => {
          liteApprovalPage.clearNextReviewDate()
          liteApprovalPage.submitButton().click()
        })

        it('should require a valid next review date string', () => {
          liteApprovalPage.setNextReviewDate('some invalid value')
          liteApprovalPage.submitButton().click()
        })

        it('should require the next review date that is after today', () => {
          liteApprovalPage.setNextReviewDate(moment().format(SHORT_DATE_FORMAT))
          liteApprovalPage.submitButton().click()
        })
      })
    })

    it('should handle a valid form submission', () => {
      liteApprovalPage.setApprovalDate('29/4/2020')
      liteApprovalPage.setApprovedCategory('A')
      liteApprovalPage.setApprovedCategoryComment('approved category comment')
      liteApprovalPage.setDepartment('GOV')
      liteApprovalPage.setApprovedPlacement('SYI')
      liteApprovalPage.setApprovedPlacementComment('approved placement comment')
      liteApprovalPage.setNextReviewDate(moment().add(1, 'year').format(SHORT_DATE_FORMAT))
      liteApprovalPage.setApprovedComment('approved comment')

      cy.task('stubSupervisorApprove')

      liteApprovalPage.submitButton().click()

      LiteCategoriesConfirmedPage.createForBookingId(bookingId)

      cy.task('selectLiteCategoryTableDbRow', { bookingId }).then((result: { rows: LiteCategoryDbRow[] }) => {
        const data = result.rows[0]

        expect(data.supervisor_category).eq('A')
        expect(data.approved_date).eq(new Date('2020-04-29').toISOString())
        expect(data.approved_by).eq('SUPERVISOR_USER')
        expect(data.approved_committee).eq('GOV')
        expect(data.next_review_date).eq(moment().add(1, 'year').startOf('day').toISOString())
        expect(data.approved_placement_prison_id).eq('SYI')
        expect(data.approved_placement_comment).eq('approved placement comment')
        expect(data.approved_comment).eq('approved comment')
        expect(data.approved_category_comment).eq('approved category comment')
      })
    })
  })

  describe('should remove an assessment if already approved in Nomis', () => {
    beforeEach(() => {
      dbSeederLiteCategory(unapprovedLiteCategorisation)

      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345YZ'],
        bookingIds: [11],
        startDates: [moment().toISOString()],
      })
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY'],
        bookingIds: [12],
        startDates: ['28/03/2019'],
      })
      cy.task('stubGetUserDetails', { user: CATEGORISER_USER, caseloadId: 'SYI' })
      cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })
      cy.task('stubGetOffenderDetailsByOffenderNoList', {
        bookingId: [12],
        offenderNumbers: ['B2345YZ'],
      })
      cy.task('stubGetOffenderDetails', {
        bookingId,
        offenderNo: 'B2345YZ',
        youngOffender: false,
        indeterminateSentence: false,
      })
      cy.task('stubAgenciesPrison')
      cy.task('stubUncategorised')

      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()

      cy.task('getLiteData', { bookingId }).then((result: { rows: LiteCategoryDbRow[] }) => {
        expect(result.rows.length).eq(1)
      })

      cy.visit(SupervisorLiteListPage.baseUrl)
      const supervisorLiteListPage = Page.verifyOnPage(SupervisorLiteListPage)
      supervisorLiteListPage.approveOtherCategoriesApprovalButton({ bookingId }).click()
    })

    it('should display an error from nomis stating that the assessment is not found', () => {
      cy.task('stubSupervisorApproveNoPendingAssessmentError', {
        bookingId: 12,
        assessmentSeq: 1,
        category: 'V',
      })

      const liteApprovalPage = LiteCategoriesApprovalPage.createForBookingId(bookingId)
      liteApprovalPage.setNextReviewDate(moment().add(1, 'year').format(SHORT_DATE_FORMAT))
      liteApprovalPage.submitButton().click()

      const liteCategorisationAlreadyApprovedPage = LiteCategoriesAlreadyApprovedPage.createForBookingId(bookingId)
      liteCategorisationAlreadyApprovedPage.validateAlreadyApprovedWarningExists({ exists: true })
      liteCategorisationAlreadyApprovedPage.validateExpectedAlreadyApprovedWarning(
        'Categorisation has already been approved',
      )

      cy.task('getLiteData', { bookingId }).then((result: { rows: LiteCategoryDbRow[] }) => {
        expect(result.rows.length).eq(0)
      })
    })
  })

  describe('hide released prisoners from supervisor display', () => {
    let supervisorDashboardHomePage: SupervisorDashboardHomePage
    beforeEach(() => {
      dbSeederLiteCategory([
        ...supervisorViewSeedData,
        {
          booking_id: 11,
          sequence: 1,
          category: 'V',
          supervisor_category: null,
          offender_no: 'B2345XY',
          prison_id: 'LEI',
          created_date: '2023-06-23 13:45:49.776453 +00:00',
          approved_date: null,
          assessed_by: 'CATEGORISER_USER',
          approved_by: null,
          assessment_committee: 'RECP',
          assessment_comment: 'comment',
          next_review_date: moment().add(6, 'months').toISOString(),
          placement_prison_id: 'BXI',
          approved_committee: null,
          approved_placement_prison_id: null,
          approved_placement_comment: null,
          approved_comment: null,
          approved_category_comment: null,
        },
      ])

      cy.task('stubAgenciesPrison')

      cy.task('stubUncategorisedAwaitingApproval')

      cy.task('stubGetOffenderDetailsByOffenderNoList', {
        bookingId: [11, 12],
        offenderNumbers: ['B2345XY', 'B2345YZ'],
      })
      cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()
    })

    it('filter B2345XY, show B2345YZ', () => {
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, 12],
        startDates: ['28/01/2019', '2019-01-31'],
        releaseDates: ['01/01/2001'],
        status: ['ACTIVE OUT', 'ACTIVE IN'],
      })

      supervisorDashboardHomePage = Page.verifyOnPage(SupervisorDashboardHomePage)
      supervisorDashboardHomePage.otherCategoriesTabLink().click()

      supervisorDashboardHomePage.validateOtherCategoriesTableData([
        ['23/06/2023', 'Dent, JaneB2345YZ', 'CATEGORISER_USER', 'V', 'Approve'],
      ])
    })

    it('show B2345XY, filter B2345YZ', () => {
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, 12],
        startDates: ['28/01/2019', '2019-01-31'],
        releaseDates: [undefined, '01/01/2000'],
        status: ['ACTIVE IN', 'ACTIVE OUT'],
      })

      supervisorDashboardHomePage = Page.verifyOnPage(SupervisorDashboardHomePage)
      supervisorDashboardHomePage.otherCategoriesTabLink().click()

      supervisorDashboardHomePage.validateOtherCategoriesTableData([
        ['23/06/2023', 'Clark, FrankB2345XY', 'CATEGORISER_USER', 'V', 'Approve'],
      ])
    })
  })
})
