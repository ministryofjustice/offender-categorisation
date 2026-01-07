import { MULTIROLE_USER } from '../factory/user'
import SupervisorHomePage from '../pages/supervisor/home'
import CategoriserHomePage from '../pages/categoriser/home'
import Page from '../pages/page'

describe('Multiple Role User Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    cy.task('stubUncategorisedAwaitingApproval', { bookingIds: [11, 12] })
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: ['2019-01-28', '2019-01-31'],
      releaseDates: [null, null],
      status: ['ACTIVE IN', 'ACTIVE IN'],
      legalStatus: ['SENTENCED', 'SENTENCED'],
    })
  })

  it('shows the supervisor home page by default for a multi-role user', () => {
    cy.stubLogin({
      user: MULTIROLE_USER,
    })
    cy.signIn()

    Page.verifyOnPage(SupervisorHomePage)
  })

  it('should allow a multi-role user to switch to the categoriser home page and back to the supervisor home page', () => {
    cy.stubLogin({
      user: MULTIROLE_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.multipleRoleDiv().should('be.visible')

    supervisorHomePage.switchRole('categoriser')
    const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.multipleRoleDiv().should('be.visible')

    categoriserHomePage.switchRole('supervisor')
    const supervisorHomePageAgain = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePageAgain.multipleRoleDiv().should('be.visible')
  })
})
