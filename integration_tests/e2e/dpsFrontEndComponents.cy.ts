import DashboardInitialPage from '../pages/dashboard/initial'
import Page from '../pages/page'
import { SUPERVISOR_USER } from '../factory/user'
import { cleanString } from '../support/utilities'

describe.skip('DPS Front End Components', () => {
  let dashboardInitialPage: DashboardInitialPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  describe('Logged out', () => {
    beforeEach(() => {
      cy.visit('/autherror', {
        failOnStatusCode: false,
      })
    })

    describe('Header', () => {
      it('should have the Digital Prison Services link', () => {
        cy.get('.hmpps-header__title__organisation-name')
          .should('have.attr', 'href', '/')
          .invoke('text')
          .then(text => expect(cleanString(text)).to.contains('Digital Prison Services'))
      })

      it('should display the environment name', () => {
        cy.get('.hmpps-header__title').should('contain.text', 'local')
      })

      it('should not display the username', () => {
        cy.get('[data-qa="manageDetails"]').should('not.exist')
      })

      it('should not allow the visitor to "Manage your details"', () => {
        cy.get('[data-qa="manageDetails"]').should('not.exist')
      })

      it('should have a "Sign out" link', () => {
        cy.get('[data-qa="signOut"]').should('contain.text', 'Sign out').should('have.attr', 'href', '/sign-out')
      })
    })

    describe('Footer', () => {
      it('should have the expected text', () => {
        cy.get('[data-qa="cat-tool-fallback-footer"]').should('contain.text', 'Official sensitive')
      })

      it('should have the expected number of links', () => {
        cy.get('.govuk-footer__inline-list-item').should('have.length', 5)
      })

      it('should have the expected Feedback link', () => {
        cy.get('#surveyLink')
          .contains('Feedback')
          .should('have.attr', 'href', 'https://eu.surveymonkey.com/r/FRZYGVQ?source=localhost/autherror')
      })

      it('should have a link to the "Accessibility statement" page', () => {
        cy.get('[data-qa="cat-tool-fallback-accessibility-statement-link"]')
          .should('contain.text', 'Accessibility statement')
          .should('have.attr', 'href')
          .and('match', /accessibility-statement$/)
      })

      it('should have a link to the "Terms and conditions" page', () => {
        cy.get('[data-qa="cat-tool-fallback-terms-conditions-link"]')
          .should('contain.text', 'Terms and conditions')
          .should('have.attr', 'href')
          .and('match', /terms-and-conditions$/)
      })

      it('should have a link to the "Privacy policy" page', () => {
        cy.get('[data-qa="cat-tool-fallback-privacy-policy-link"]')
          .should('contain.text', 'Privacy policy')
          .should('have.attr', 'href')
          .and('match', /privacy-policy$/)
      })

      it('should have a link to the "Cookies policy" page', () => {
        cy.get('[data-qa="cat-tool-fallback-cookies-policy-link"]')
          .should('contain.text', 'Cookies policy')
          .should('have.attr', 'href')
          .and('match', /cookies-policy$/)
      })
    })
  })

  describe('Logged in', () => {
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

      describe('Header', () => {
        it('should have the Digital Prison Services link', () => {
          cy.get('.hmpps-header__title__organisation-name')
            .should('have.attr', 'href', '/')
            .invoke('text')
            .then(text => expect(cleanString(text)).to.contains('Digital Prison Services'))
        })

        it('should display the environment name', () => {
          cy.get('.hmpps-header__title').should('contain.text', 'local')
        })

        it('should display the username', () => {
          cy.get('[data-qa="manageDetails"]')
            .should('contain.text', 'T. User')
            .should('have.attr', 'href')
            .and('match', /\/auth\/account-details$/)
        })

        it('should allow the user to "Manage your details"', () => {
          cy.get('[data-qa="manageDetails"]')
            .should('contain.text', 'Manage your details')
            .should('have.attr', 'href')
            .and('match', /\/auth\/account-details$/)
        })

        it('should have a "Sign out" link', () => {
          cy.get('[data-qa="signOut"]').should('contain.text', 'Sign out').should('have.attr', 'href', '/sign-out')
        })
      })

      describe('Footer', () => {
        it('should have the expected text', () => {
          dashboardInitialPage.fallbackFooter().should('contain.text', 'Official sensitive')
        })

        it('should have the expected number of links', () => {
          cy.get('.govuk-footer__inline-list-item').should('have.length', 5)
        })

        it('should have the expected Feedback link', () => {
          cy.get('#surveyLink')
            .contains('Feedback')
            .should('have.attr', 'href', 'https://eu.surveymonkey.com/r/FRZYGVQ?source=localhost/dashboardInitial')
        })

        it('should have a link to the "Accessibility statement" page', () => {
          cy.get('[data-qa="cat-tool-fallback-accessibility-statement-link"]')
            .should('contain.text', 'Accessibility statement')
            .should('have.attr', 'href')
            .and('match', /accessibility-statement$/)
        })

        it('should have a link to the "Terms and conditions" page', () => {
          cy.get('[data-qa="cat-tool-fallback-terms-conditions-link"]')
            .should('contain.text', 'Terms and conditions')
            .should('have.attr', 'href')
            .and('match', /terms-and-conditions$/)
        })

        it('should have a link to the "Privacy policy" page', () => {
          cy.get('[data-qa="cat-tool-fallback-privacy-policy-link"]')
            .should('contain.text', 'Privacy policy')
            .should('have.attr', 'href')
            .and('match', /privacy-policy$/)
        })

        it('should have a link to the "Cookies policy" page', () => {
          cy.get('[data-qa="cat-tool-fallback-cookies-policy-link"]')
            .should('contain.text', 'Cookies policy')
            .should('have.attr', 'href')
            .and('match', /cookies-policy$/)
        })
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

      describe('Header', () => {
        it('should have the Digital Prison Services link', () => {
          cy.get('.connect-dps-common-header__title__organisation-name')
            .should('have.attr', 'href', 'http://localhost:9091/dps')
            .invoke('text')
            .then(text => expect(cleanString(text)).to.contains('Digital Prison Services'))
        })

        it('should display the environment name', () => {
          cy.get('.govuk-phase-banner')
            .invoke('text')
            .then(text => expect(cleanString(text)).to.contains('CYPRESS TESTING'))
        })

        it('should have a link to change your caseload', () => {
          cy.get('[data-qa="changeCaseLoad"]')
            .should('contain.text', 'Hewell (HMP)')
            .should('have.attr', 'href', 'http://localhost:9091/dps/change-caseload')
        })

        it('should display the username', () => {
          cy.get('[data-qa="manageDetails"]')
            .should('contain.text', 'T. Testfield')
            .should('have.attr', 'href')
            .and('match', /\/auth\/account-details$/)
        })

        it('should allow the user to "Manage your details"', () => {
          cy.get('[data-qa="manageDetails"]')
            .should('contain.text', 'Manage your details')
            .should('have.attr', 'href')
            .and('match', /\/auth\/account-details$/)
        })

        it('should have a "Sign out" link', () => {
          cy.get('[data-qa="signOut"]').should('contain.text', 'Sign out').should('have.attr', 'href', '/sign-out')
        })
      })

      describe('Footer', () => {
        it('has the expected links', () => {
          dashboardInitialPage.mockDpsComponentFooter().get('.connect-dps-common-footer__link').should('have.length', 5)
        })

        it('should have the expected Feedback / survey link in the footer', () => {
          dashboardInitialPage
            .mockDpsComponentFooter()
            .get('.connect-dps-common-footer__link')
            .contains('Feedback')
            .should('have.attr', 'href', 'https://eu.surveymonkey.com/r/FRZYGVQ?source=localhost/dashboardInitial')
        })

        it('should have the expected text', () => {
          dashboardInitialPage.mockDpsComponentFooter().should('contain.text', 'Get help with DPS')
        })

        it('should have the expected number of links', () => {
          cy.get('.connect-dps-common-footer__inline-list-item').should('have.length', 5)
        })

        it('should have the expected Feedback link', () => {
          cy.get('footer a')
            .contains('Feedback')
            .should('have.attr', 'href', 'https://eu.surveymonkey.com/r/FRZYGVQ?source=localhost/dashboardInitial')
        })

        it('should have a link to the "Accessibility statement" page', () => {
          cy.get('footer a')
            .contains('Accessibility statement')
            .should('have.attr', 'href')
            .and('match', /accessibility-statement$/)
        })

        it('should have a link to the "Terms and conditions" page', () => {
          cy.get('footer a')
            .contains('Terms and conditions')
            .should('have.attr', 'href')
            .and('match', /terms-and-conditions$/)
        })

        it('should have a link to the "Privacy policy" page', () => {
          cy.get('footer a')
            .contains('Privacy policy')
            .should('have.attr', 'href')
            .and('match', /privacy-policy$/)
        })

        it('should have a link to the "Cookies policy" page', () => {
          cy.get('footer a')
            .contains('Cookies policy')
            .should('have.attr', 'href')
            .and('match', /cookies-policy$/)
        })
      })
    })
  })
})
