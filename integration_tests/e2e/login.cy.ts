import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'
import { SECURITY_USER } from '../factory/user'
import SecurityHomePage from '../pages/security/home'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetMyDetails', { user: SECURITY_USER })
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/login')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
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
    cy.signIn()
    const securityHomePage = Page.verifyOnPage(SecurityHomePage)

    securityHomePage.manageDetails().get('a').invoke('removeAttr', 'target')
    securityHomePage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('Token verification failure clears user session and takes user to sign in page', () => {
    cy.signIn()
    const securityHomePage = Page.verifyOnPage(SecurityHomePage)
    cy.setCookie('session', 'no_longer_valid')

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.signIn()

    securityHomePage.headerUserName().should('contain.text', 'A. User')
  })
})
