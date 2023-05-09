export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  checkPageUrl(url: string | RegExp): void {
    cy.url().should('match', url)
  }

  signOut = (): PageElement => cy.get('[data-qa=logout]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  errorSummaries = (): PageElement =>
    cy.get('#error-summary-title').contains('There is a problem').get('ul.govuk-error-summary__list li')

  errors = (): PageElement => cy.get('.govuk-error-message')

  validateRadioButtonSelections = (optionSelectors: string[], isChecked: boolean): void =>
    optionSelectors.forEach(optionSelector =>
      cy.get(optionSelector).should(isChecked ? 'be.checked' : 'not.be.checked')
    )

  validateSelectorExists = (selector: string, exists: boolean) =>
    cy.get(selector).should(exists ? 'exist' : 'not.exist')

  validateSelectorVisibility = (selector: string, isVisible: boolean) =>
    cy.get(selector).should(isVisible ? 'be.visible' : 'not.be.visible')

  validateErrorSummaryMessages(errorSummaryMessages: { index: number; href: string; text: string }[]) {
    errorSummaryMessages.forEach(({ index, href, text }) => {
      this.errorSummaries().eq(index).find('a').should('have.attr', 'href', href).should('have.text', text)
    })
  }

  validateErrorMessages(errorMessages: { selector: string; text: string }[]) {
    errorMessages.forEach(({ selector, text }) => {
      cy.get(selector).should('contain.text', text)
    })
  }

  protected _cleanString = (rawText): string => rawText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
}
