export default class ErrorPage {
  public static readonly ERROR_SUMMARY_TITLE_SELECTOR = 'h2.govuk-error-summary__title'

  checkErrorMessage({ heading, body }: { heading: string; body: string }): void {
    cy.get(ErrorPage.ERROR_SUMMARY_TITLE_SELECTOR).contains(heading)
    body && cy.get('.govuk-error-summary__body').contains(body)
  }
}
