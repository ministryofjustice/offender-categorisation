import Page, { PageElement } from '../../../page'

export default class DecisionPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/decision`
  }

  constructor() {
    super('Category decision')
  }

  form = (): PageElement => cy.get('form')
  behaviour = (): PageElement => cy.get('#behaviour')
  openOption = (): PageElement => cy.get('#openOption')
  closedOption = (): PageElement => cy.get('#closedOption')
  yoiClosedOption = (): PageElement => cy.get('#catIOption')
  yoiOpenOption = (): PageElement => cy.get('#catJOption')
  catBOption = (): PageElement => cy.get('#catBOption')
  catCOption = (): PageElement => cy.get('#catCOption')
  catDOption = (): PageElement => cy.get('#catDOption')
  hints = (): PageElement => cy.get('.govuk-radios__hint')
  submitButton = (): PageElement => cy.get('button[type="submit"]')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')
  indeterminateWarning = (): PageElement => cy.get('#indeterminateWarning')

  enterCategoryDecisionJustification = (text: string): PageElement => cy.get('#justification').type(text)
}
