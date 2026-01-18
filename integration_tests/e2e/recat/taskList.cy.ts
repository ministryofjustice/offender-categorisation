import moment from 'moment'
import { QueryResult } from 'pg'
import { CATEGORISER_USER, RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import CancelPage from '../../pages/cancel/cancel'
import CancelConfirmedPage from '../../pages/cancel/cancelConfirmed'
import { FormDbRowRaw } from '../../db/queries'
import ErrorPage from '../../pages/error/error'

const insertFormRow = (overrides: Partial<Parameters<typeof cy.task>[1]>) =>
  cy.task('insertFormTableDbRow', {
    id: -1,
    bookingId: 12,
    formResponse: '{}',
    userId: 'RECATEGORISER_USER',
    status: 'APPROVED',
    catType: 'RECAT',
    assignedUserId: null,
    referredDate: null,
    referredBy: null,
    sequenceNumber: 1,
    riskProfile: null,
    prisonId: 'LEI',
    offenderNo: 'dummy',
    startDate: new Date(),
    securityReviewedBy: null,
    securityReviewedDate: null,
    approvalDate: new Date(),
    approvedBy: 'SUPERVISOR_USER',
    assessmentDate: null,
    assessedBy: null,
    reviewReason: 'DUE',
    dueByDate: null,
    cancelledDate: null,
    cancelledBy: null,
    nomisSequenceNumber: null,
    ...overrides,
  })

const defaultRatingsC = {
  offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
  securityInput: { securityInputNeeded: 'No' },
  furtherCharges: { furtherCharges: 'No' },
  violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'No' },
  escapeRating: { escapeOtherEvidence: 'No' },
  extremismRating: { previousTerrorismOffences: 'No' },
  nextReviewDate: { date: '14/12/2019' },
}

describe('Recat tasklist DB sequencing and cancellation behaviour', () => {
  beforeEach(() => {
    const today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
    cy.task('deleteRowsFromSecurityReferral')

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [12, 11],
      startDates: [today, today],
      emptyResponse: false,
      releaseDates: [moment().add(1, 'days').toISOString(), moment().add(1, 'days').toISOString()],
      status: ['ACTIVE IN', 'ACTIVE IN'],
      legalStatus: ['SENTENCED', 'SENTENCED'],
    })

    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
      basicInfo: false,
    })

    cy.task('stubGetOcgmAlert', { offenderNo: 'B2345YZ', transferToSecurity: false })
    cy.task('stubGetExtremismProfile', { offenderNo: 'B2345YZ', band: 4 })
  })

  it('cancels and resets any security flag to NEW', () => {
    cy.task('insertSecurityReferralTableDbRow', { offenderNumber: 'B2345YZ', bookingId: 12 })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ', emptyResponse: false, bookingId: 12 })
    cy.task('stubAgencyDetails', { agency: 'LPI' })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    const recatHome = Page.verifyOnPage(RecategoriserHomePage)
    recatHome.selectPrisonerWithBookingId(12, 'Start')

    const tasklist = TasklistRecatPage.createForBookingId(12)

    cy.task('getSecurityReferral', { offenderNumber: 'B2345YZ' }).then(
      // in the deprecated groovy test this was expecting 'PROCESSED',
      // but I couldn't find any logic suggesting that would be the case
      (result: { rows: Array<{ status: string }> }) => {
        expect(result.rows[0].status).to.eq('REFERRED')
      },
    )

    tasklist.cancelLink().click()
    const cancelPage1 = Page.verifyOnPage(CancelPage)
    cancelPage1.confirmNo().click()
    cancelPage1.submitButton().click()
    Page.verifyOnPage(TasklistRecatPage)

    tasklist.cancelLink().click()
    const cancelPage2 = Page.verifyOnPage(CancelPage)

    cy.task('stubSetInactive', { bookingId: 12, status: 'PENDING' })

    cancelPage2.confirmYes().click()
    cancelPage2.submitButton().click()

    const cancelConfirmed = Page.verifyOnPage(CancelConfirmedPage)
    cancelConfirmed.finishButton().should('be.visible')
    cancelConfirmed.manageLink().should('be.visible')

    cy.task('getSecurityReferral', { offenderNumber: 'B2345YZ' }).then(
      (result: { rows: Array<{ status: string }> }) => {
        expect(result.rows[0].status).to.eq('NEW')
      },
    )
  })

  it('creates seq 2 STARTED RECAT when seq 1 APPROVED RECAT exists', () => {
    // Mirror deprecated db.createDataWithStatusAndCatType(12, 'APPROVED', '{}', 'RECAT')
    insertFormRow({})

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    const recatHome = Page.verifyOnPage(RecategoriserHomePage)
    recatHome.selectPrisonerWithBookingId(12, 'Start')
    Page.verifyOnPage(TasklistRecatPage)

    cy.task('selectFormTableDbRow', { bookingId: 12 }).then((data: QueryResult<FormDbRowRaw>) => {
      const rows = [...data.rows].sort((a, b) => a.sequence_no - b.sequence_no)
      expect(rows.map(r => r.status)).to.deep.eq(['APPROVED', 'STARTED'])
      expect(rows.map(r => r.cat_type)).to.deep.eq(['RECAT', 'RECAT'])
      expect(rows.map(r => r.sequence_no)).to.deep.eq([1, 2])
    })
  })

  it('continues current RECAT when seq 1 STARTED RECAT exists (does not create seq 2)', () => {
    // Mirror db.createDataWithStatusAndCatType(12, 'STARTED', '{}', 'RECAT')
    insertFormRow({
      status: 'STARTED',
      approvalDate: null,
      approvedBy: null,
    })
    cy.task('stubGetUserDetails', {
      user: CATEGORISER_USER,
      caseloadId: 'LEI',
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    const recatHome = Page.verifyOnPage(RecategoriserHomePage)
    recatHome.selectPrisonerWithBookingId(12, 'Edit')
    Page.verifyOnPage(TasklistRecatPage)

    cy.task('selectFormTableDbRow', { bookingId: 12 }).then((data: QueryResult<FormDbRowRaw>) => {
      const rows = [...data.rows].sort((a, b) => a.sequence_no - b.sequence_no)

      expect(rows).to.have.length(1)
      expect(rows.map(r => r.status)).to.deep.eq(['STARTED'])
      expect(rows.map(r => r.cat_type)).to.deep.eq(['RECAT'])
      expect(rows.map(r => r.sequence_no)).to.deep.eq([1])
    })
  })

  it('creates seq 2 STARTED RECAT when seq 1 APPROVED INITIAL exists', () => {
    // Mirror db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([ratings: TestFixture.defaultRatingsC]), 'INITIAL')
    insertFormRow({
      userId: 'CATEGORISER_USER',
      catType: 'INITIAL',
      formResponse: JSON.stringify({ ratings: defaultRatingsC }),
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    const recatHome = Page.verifyOnPage(RecategoriserHomePage)
    recatHome.selectPrisonerWithBookingId(12, 'Start', 'DUE')
    Page.verifyOnPage(TasklistRecatPage)

    cy.task('selectFormTableDbRow', { bookingId: 12 }).then((data: QueryResult<FormDbRowRaw>) => {
      const rows = [...data.rows].sort((a, b) => a.sequence_no - b.sequence_no)

      expect(rows.map(r => r.status)).to.deep.eq(['APPROVED', 'STARTED'])
      expect(rows.map(r => r.cat_type)).to.deep.eq(['INITIAL', 'RECAT'])
      expect(rows.map(r => r.sequence_no)).to.deep.eq([1, 2])
      expect(rows.map(r => r.review_reason)).to.deep.eq(['DUE', 'DUE'])
    })
  })

  it('shows error when an incomplete INITIAL record exists (SECURITY_BACK)', () => {
    // Mirror: db.createDataWithStatusAndCatType(12, 'SECURITY_BACK', '{}', 'INITIAL')
    insertFormRow({
      userId: 'CATEGORISER_USER',
      status: 'SECURITY_BACK',
      catType: 'INITIAL',
      formResponse: '{}',
      approvalDate: null,
      approvedBy: null,
    })

    cy.stubLogin({ user: RECATEGORISER_USER })
    cy.signIn()

    Page.verifyOnPage(RecategoriserHomePage)
    cy.visit('/tasklistRecat/12')

    const errorPage = new ErrorPage()
    errorPage.checkErrorMessage({
      heading: 'Error: The initial categorisation is still in progress',
      body: '',
    })
  })
})
