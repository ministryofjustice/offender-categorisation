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
}
