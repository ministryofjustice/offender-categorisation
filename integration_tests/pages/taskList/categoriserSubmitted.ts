import Page, { PageElement } from '../page'

export default class CategoriserSubmittedPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklist/categoriserSubmitted/${this._bookingId}`
  }

  constructor() {
    super('Submitted for approval')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserSubmittedPage()
  }

  finishButton = (): PageElement => cy.get('a[href="/"]').contains('Finish')
  smartSurveyLink = (): PageElement => cy.get('#smartSurveyLink')
}
