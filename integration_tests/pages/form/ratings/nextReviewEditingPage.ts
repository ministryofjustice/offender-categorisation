import Page, { PageElement } from '../../page'

export default class NextReviewEditingPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/nextReviewDate/nextReviewDateEditing/${this._bookingId}`
  }

  constructor() {
    super('Check the date they will be reviewed by')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new NextReviewEditingPage()
  }

  getChangeThisDateLink = (expectedUrl: string): PageElement =>
    cy.get('#changeLink').contains('Change this').should('have.attr', 'href', expectedUrl)
}
