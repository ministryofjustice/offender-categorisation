import Page from '../page'

export default class ApprovedViewPage extends Page {
  static baseUrl: string = '/form/approvedView'

  constructor() {
    super('Categorisation outcome')
  }

  validateCategorisationWarnings(warnings: string[]) {
    warnings.forEach((warning, index) => {
      cy.get(`.govuk-warning-text:eq(${index})`).should('contain.text', 'Warning')
      cy.get(`.govuk-warning-text:eq(${index})`).should('contain.text', warning)
    })
  }

  validateCommentsVisibility({ areVisible }: { areVisible: boolean }) {
    cy.get('.forms-comments-text').should(areVisible ? 'exist' : 'not.exist')
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

  getBackToCaseListButton() {
    return cy.get(`a[role='button']`).contains('Back to case list')
  }
}
