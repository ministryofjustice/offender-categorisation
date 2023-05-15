export default class ErrorPage {
  checkErrorMessage({ heading, body }: { heading: string; body: string }): void {
    cy.get('#error-summary-title').should('contain.text', heading)
    cy.get('.govuk-error-summary__body').should('contain.text', body)
  }
}
