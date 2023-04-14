export default class ErrorPage {
  checkErrorMessage({ heading, body }: { heading: string; body: string }): void {
    cy.get('#error-summary-title').contains(heading)
    cy.get('.govuk-error-summary__body').contains(body)
  }
}
