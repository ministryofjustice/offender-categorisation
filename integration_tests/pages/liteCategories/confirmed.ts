import Page from '../page'

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
}
