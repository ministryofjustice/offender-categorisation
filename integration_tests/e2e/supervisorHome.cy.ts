import { RECATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import SupervisorHomePage from '../pages/supervisor/home'
import Page from '../pages/page'
import { CASELOAD } from '../factory/caseload'
import { calculateDueDate } from '../support/utilities'

describe('Supervisor Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  it('should be inaccessible to users without SUPERVISOR_USER', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.request({
      url: SupervisorHomePage.baseUrl,
      failOnStatusCode: false,
    }).then(resp => {
      expect(resp.status).to.eq(403)
    })
  })

  describe('when the user has the required role', () => {
    const offender1 = {
      offenderNo: 'B2345XY',
      bookingId: 11,
      startDate: '2020-10-14',
    }
    const offender2 = {
      offenderNo: 'B2345YZ',
      bookingId: 12,
      startDate: '2022-12-25',
    }

    beforeEach(() => {
      cy.task('stubCategorisedMultiple')
      cy.task('stubUncategorisedAwaitingApproval')
      cy.task('stubSentenceData', {
        offenderNumbers: [offender1.offenderNo, offender2.offenderNo],
        bookingIds: [offender1.bookingId, offender2.bookingId],
        startDates: [offender1.startDate, offender2.startDate],
      })
      cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.LEI] })
      cy.task('stubGetStaffDetailsByUsernameList', {
        usernames: [RECATEGORISER_USER.username, SUPERVISOR_USER.username],
      })
      cy.task('stubGetPrisonerSearchPrisoners')
    })

    it('should show the no results message by default', () => {
      cy.task('stubUncategorisedAwaitingApproval', { emptyResponse: true })

      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.noResultsDiv().should('be.visible')
    })

    it('should show awaiting categorisations', () => {
      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.validateToDoTableData([
        [
          'Pitstop, Penelope',
          offender1.offenderNo,
          calculateDueDate(offender1.startDate).daysSinceSentence.toString(),
          calculateDueDate(offender1.startDate).dateRequired,
          '01/01/2025',
          'Roger Rabbit',
          'B',
          '',
          'PNOMIS',
        ],
        [
          'Hillmob, Ant',
          offender2.offenderNo,
          calculateDueDate(offender2.startDate).daysSinceSentence.toString(),
          calculateDueDate(offender2.startDate).dateRequired,
          '02/02/2025',
          'Bugs Bunny',
          'C',
          '',
          'PNOMIS',
        ],
      ])
    })
  })
})
