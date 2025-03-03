import { RECATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import SupervisorHomePage from '../pages/supervisor/home'
import Page from '../pages/page'
import { CASELOAD } from '../factory/caseload'
import { calculateDueDate } from '../support/utilities'
import prisonerSearch from '../mockApis/prisonerSearch'

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

    const offender3 = {
      offenderNo: 'B2345ZZ',
      bookingId: 13,
      startDate: '2023-08-15',
      dateRequired: null,
    }

    type OffenderTableRow = [string, string, string, string, string, string, string, string]

    const offender1TableData: OffenderTableRow = [
      `Pitstop, Penelope${offender1.offenderNo}`,
      calculateDueDate(offender1.startDate).daysSinceSentence.toString(),
      calculateDueDate(offender1.startDate).dateRequired,
      '01/01/2025',
      'Roger Rabbit',
      'B',
      '',
      'PNOMIS',
    ]

    const offender2TableData: OffenderTableRow = [
      `Hillmob, Ant${offender2.offenderNo}`,
      calculateDueDate(offender2.startDate).daysSinceSentence.toString(),
      calculateDueDate(offender2.startDate).dateRequired,
      '02/02/2025',
      'Bugs Bunny',
      'C',
      '',
      'PNOMIS',
    ]

    const offender3TableData: OffenderTableRow = [
      `Newcomer, Test${offender3.offenderNo}`,
      calculateDueDate(offender3.startDate).daysSinceSentence.toString(),
      '',
      '03/03/2025',
      'Daffy Duck',
      'D',
      '',
      'PNOMIS',
    ]

    beforeEach(() => {
      cy.task('stubCategorisedMultiple')
      cy.task('stubUncategorisedAwaitingApproval')
      cy.task('stubSentenceData', {
        offenderNumbers: [offender1.offenderNo, offender2.offenderNo, offender3.offenderNo],
        bookingIds: [offender1.bookingId, offender2.bookingId, offender3.bookingId],
        startDates: [offender1.startDate, offender2.startDate, offender3.startDate],
        releaseDates: [null, null, null],
        status: ['ACTIVE IN', 'ACTIVE IN', 'ACTIVE IN'],
        legalStatus: ['SENTENCED', 'SENTENCED', 'SENTENCED'],
      }).then(data => {
        cy.task('log', `✅ Stubbed Sentence Data: ${JSON.stringify(data, null, 2)}`)
      })
      cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.LEI] })
      cy.task('stubGetStaffDetailsByUsernameList', {
        usernames: [RECATEGORISER_USER.username, SUPERVISOR_USER.username],
      })
      cy.task('stubGetPrisonerSearchPrisoners')
      cy.intercept('POST', '/prisoner-search/prisoner-search/booking-ids').as('prisonerSearch')
      console.log({prisonerSearch})

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
      supervisorHomePage.validateToDoTableData([offender1TableData, offender2TableData, offender3TableData])
    })

    it('should sort by due date when triggered', () => {
      cy.stubLogin({
        user: SUPERVISOR_USER,
      })
      cy.signIn()

      it('should log API request and response', () => {
        cy.wait('@prisonerSearch').then(interception => {
          cy.task('log', `✅ Actual Request Body: ${JSON.stringify(interception.request.body, null, 2)}`)
          cy.task('log', `✅ Response Body: ${JSON.stringify(interception.response.body, null, 2)}`)
          cy.task('log', `✅ Status Code: ${interception.response.status}`)
        })
      })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)

      supervisorHomePage.validateToDoTableData([offender1TableData, offender2TableData, offender3TableData])
      cy.get('th button[data-index="2"]').click({ force: true })
      supervisorHomePage.validateToDoTableData([offender3TableData, offender2TableData, offender1TableData])
      cy.get('th button[data-index="2"]').click({ force: true })
      supervisorHomePage.validateToDoTableData([offender2TableData, offender1TableData, offender3TableData])
    })
  })
})
