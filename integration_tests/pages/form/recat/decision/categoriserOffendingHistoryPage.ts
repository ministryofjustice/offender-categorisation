import Page, { PageElement } from '../../../page'

export default class CategoriserOffendingHistoryPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/offendingHistory/${this._bookingId}`
  }

  constructor() {
    super('Offending history')
  }

  catAWarning = (): PageElement => cy.get('div.govuk-warning-text')
  catAInfo = (): PageElement => cy.get('div.govuk-inset-text')
  form = (): PageElement => cy.get('form')
  previousConvictionsText = (): PageElement => cy.get('#previousConvictionsText')
  saveButton = (): PageElement => cy.get('button.govuk-button')
  previousConvictionsYes = (): PageElement => cy.get('#previousConvictions')
  previousConvictionsNo = (): PageElement => cy.get('#previousConvictions-2')
  history = (): PageElement => cy.get('div.forms-comments-text li')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserOffendingHistoryPage()
  }
}
