import Page, { PageElement } from '../page'

const SELECTORS = {}

export default class LiteCategoriesConfirmedPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/liteCategories/confirmed/${this._bookingId}`
  }

  constructor() {
    super('Categorisation has been submitted')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new LiteCategoriesConfirmedPage()
  }

  // submitButton = (): PageElement => cy.get(SELECTORS.BUTTON.SUBMIT).contains('Submit')
}
