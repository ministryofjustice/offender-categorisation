import Page, { PageElement } from '../../page'

export default class CategoriserReviewCYAPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/categoriser/review/${this._bookingId}`
  }

  constructor() {
    super('Check your answers before you continue')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserReviewCYAPage()
  }

  changeLinks = (): PageElement => cy.get('a.govuk-link').filter(':contains("Change")')

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')
}
