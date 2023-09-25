import DashboardInitialPage from '../pages/dashboard/initial'
import Page from '../pages/page'
import { SUPERVISOR_USER } from '../factory/user'

describe('DPS Front End Components', () => {
  let dashboardInitialPage: DashboardInitialPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B0012XY'],
      bookingIds: [12],
      startDates: ['28/01/2019'],
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()
  })

  describe('Fallback components', () => {
    beforeEach(() => {
      cy.task('stubDpsComponentsFail')

      cy.visit(DashboardInitialPage.baseUrl)
      dashboardInitialPage = Page.verifyOnPage(DashboardInitialPage)

      dashboardInitialPage.fallbackHeader().should('exist')
      dashboardInitialPage.fallbackFooter().should('exist')

      dashboardInitialPage.mockDpsComponentHeader().should('not.exist')
      dashboardInitialPage.mockDpsComponentFooter().should('not.exist')
    })

    it('User name visible in fallback header', () => {
      dashboardInitialPage.fallbackHeader().should('contain.text', 'local')
      dashboardInitialPage.fallbackHeader().should('contain.text', 'T. User')
    })

    it('Fallback footer exists basic links', () => {
      dashboardInitialPage.fallbackFooter().should('contain.text', 'Official sensitive')
    })
  })

  describe('Mocked API response components', () => {
    beforeEach(() => {
      cy.task('stubDpsComponentsSuccess')

      cy.visit(DashboardInitialPage.baseUrl)
      dashboardInitialPage = Page.verifyOnPage(DashboardInitialPage)

      dashboardInitialPage.fallbackHeader().should('not.exist')
      dashboardInitialPage.fallbackFooter().should('not.exist')

      dashboardInitialPage.mockDpsComponentHeader().should('exist')
      dashboardInitialPage.mockDpsComponentFooter().should('exist')
    })

    it('User name visible in fallback header', () => {
      dashboardInitialPage.headerUserName().should('contain.text', 'T. Testfield')
    })

    it('Fallback footer exists basic links', () => {
      dashboardInitialPage.mockDpsComponentFooter().get('.connect-dps-common-footer__link').should('have.length', 5)
    })

    it('should have the expected Feedback / survey link in the footer', () => {
      dashboardInitialPage
        .mockDpsComponentFooter()
        .get('.connect-dps-common-footer__link')
        .contains('Feedback')
        .should('have.attr', 'href', 'https://eu.surveymonkey.com/r/FRZYGVQ?source=localhost/dashboardInitial')
    })
  })
})
