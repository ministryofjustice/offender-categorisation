import Page, { PageElement } from '../page'

export default abstract class BaseApprovedViewPage extends Page {
  validateCategorisationWarnings(warnings: string[]) {
    warnings.forEach((warning, index) => {
      cy.get(`.govuk-warning-text:eq(${index})`).should('contain.text', 'Warning')
      cy.get(`.govuk-warning-text:eq(${index})`).should('contain.text', warning)
    })
  }

  validateCommentsVisibility({ areVisible, comments = undefined }: { areVisible: boolean; comments?: string }) {
    cy.get('.forms-comments-text').should(areVisible ? 'exist' : 'not.exist')
    if (typeof comments !== 'undefined') {
      cy.get('.forms-comments-text').contains(comments)
    }
  }

  validateOpenConditionsHeadingVisibility({ isVisible }: { isVisible: boolean }) {
    cy.get('.openConditionsHeader').should(isVisible ? 'exist' : 'not.exist')
  }

  validateCategoriserComments({ expectedComments }: { expectedComments: string }) {
    cy.get('#overriddenText').should('contain.text', expectedComments)
  }

  validateSupervisorComments({ expectedComments }: { expectedComments: string }) {
    cy.get('#overriddenText-2').should('contain.text', expectedComments)
  }

  validateOtherSupervisorComments({ expectedComments }: { expectedComments: string }) {
    cy.get('#other-text-supervisor').should('contain.text', expectedComments)
  }

  validatePreviousSupervisorComments({ expectedComments }: { expectedComments: string }) {
    cy.get('#previous-overriddenText').should('contain.text', expectedComments)
  }

  getBackToCaseListButton() {
    return cy.get(`a[role='button']`).contains('Back to case list')
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Submit')
}
