import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'
import { SECURITY_USER, SUPERVISOR_USER } from '../factory/user'
import SecurityHomePage from '../pages/security/home'
import SupervisorHomePage from '../pages/supervisor/home'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.stubLogin({
      user: SECURITY_USER,
    })
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.task('stubDpsComponentsFail')

    cy.signIn()
    const securityHomePage = Page.verifyOnPage(SecurityHomePage)
    securityHomePage.headerUserName().should('contain.text', 'A. User')
  })

  it('User can log out', () => {
    cy.signIn()
    const securityHomePage = Page.verifyOnPage(SecurityHomePage)
    securityHomePage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User can manage their details', () => {
    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.task('stubSentenceData', { emptyResponse: true })
    cy.task('stubUncategorised')
    cy.signIn()
    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)

    supervisorHomePage.manageDetails().get('a').invoke('removeAttr', 'target')
    supervisorHomePage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('Token verification failure clears user session and takes user to sign in page', () => {
    cy.signIn()
    const securityHomePage = Page.verifyOnPage(SecurityHomePage)
    cy.setCookie('session', 'no_longer_valid')

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.signIn()

    securityHomePage.headerUserName().should('contain.text', 'T. Testfield')
  })
})
