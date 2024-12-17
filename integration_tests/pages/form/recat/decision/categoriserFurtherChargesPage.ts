import Page, { PageElement } from '../../../page'

export default class CategoriserFurtherChargesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/furtherCharges/${this._bookingId}`
  }

  constructor() {
    super('Further charges')
  }

  form = (): PageElement => cy.get('form')
  saveButton = (): PageElement => cy.get('button.govuk-button')
  furtherChargesYes = (): PageElement => cy.get('#furtherCharges')
  furtherChargesNo = (): PageElement => cy.get('#furtherCharges-2')
  furtherChargesCatBYes = (): PageElement => cy.get('#furtherChargesCatB')
  furtherChargesCatBNo = (): PageElement => cy.get('#furtherChargesCatB-2')
  furtherChargesText = (): PageElement => cy.get('#furtherChargesText')
  history = (): PageElement => cy.get('div.forms-comments-text li')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserFurtherChargesPage()
  }
}
