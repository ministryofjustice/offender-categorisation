import moment from 'moment'
import { CATEGORISER_USER } from '../factory/user'
import Page from '../pages/page'
import CategoriserHomePage from '../pages/categoriser/home'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import STATUS from '../../server/utils/statusEnum'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import AwaitingApprovalPage from '../pages/awaitingSupervisorApproval/awaitingApprovalView'
import CancelPage from '../pages/cancel/cancel'
import CancelConfirmedPage from '../pages/cancel/cancelConfirmed'

describe('Categoriser Home page', () => {
  const bookingId = 11
  let today: Date

  beforeEach(() => {
    today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    cy.task('insertFormTableDbRow', {
      id: 2,
      bookingId,
      formResponse: '{}',
      userId: 'CATEGORISER_USER',
      status: STATUS.AWAITING_APPROVAL.name,
      catType: CATEGORISATION_TYPE.INITIAL,
      assignedUserId: null,
      referredDate: null,
      referredBy: null,
      sequenceNumber: 2,
      riskProfile: null,
      prisonId: AGENCY_LOCATION.LEI.id,
      offenderNo: 'B2345YZ',
      startDate: new Date(),
      securityReviewedBy: null,
      securityReviewedDate: null,
    })

    cy.task('stubUncategorised')

    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetOffenderDetails', {
      bookingId: 11,
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
      alertCode: 'XEL',
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

    cy.stubLogin({ user: CATEGORISER_USER })

    cy.signIn()
  })

  it('allows a categorisation awaiting approval to be viewed and cancelled', () => {
    const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)

    categoriserHomePage.selectPrisonerAwaitingApprovalWithBookingId(bookingId, 'View')

    const awaitingApprovalPage = Page.verifyOnPage(AwaitingApprovalPage)
    awaitingApprovalPage.cancelLink().click()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.confirmNo().click()
    cancelPage.submitButton().click()

    awaitingApprovalPage.cancelLink().click()
    cy.task('stubSetInactive', { bookingId: 11, status: 'PENDING' })
    cancelPage.confirmYes().click()
    cancelPage.submitButton().click()

    cy.task('stubUncategorisedAfterCancellation')

    const cancelConfirmedPage = new CancelConfirmedPage()
    cancelConfirmedPage.finishButton().should('be.visible')
    cancelConfirmedPage.finishButton().click()

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 11 }, data => {
      const dbRecord = data.rows[0]

      expect(dbRecord.status).to.equal('CANCELLED')
      expect(dbRecord.cancelled_by).to.equal('CATEGORISER_USER')
      expect(dbRecord.cancelled_date).to.not.equal(null)

      return true
    })

    Page.verifyOnPage(CategoriserHomePage)

    cy.contains('tr', 'B2345YZ').within(() => {
      cy.get('td')
        .invoke('text')
        .then(text => {
          const normalised = text.replace(/\s+/g, ' ').trim()
          expect(normalised).to.include('Not categorised')
          expect(normalised).to.include('Start')
        })
    })
  })
})
