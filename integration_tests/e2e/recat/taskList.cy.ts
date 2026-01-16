import moment from 'moment'
import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import CancelPage from '../../pages/cancel/cancel'
import CancelConfirmedPage from '../../pages/cancel/cancelConfirmed'

describe('Recat tasklist cancellation includes security flag handling', () => {
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

    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345YZ',
      transferToSecurity: false,
    })
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
      // in the deprecated groove test this was expecting 'PROCESSED', but I couldn't find any logic suggesting that would be the case
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
})
