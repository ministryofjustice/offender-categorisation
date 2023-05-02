import Page, { PageElement } from '../page'

export default class TaskListPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklist/${this._bookingId}`
  }

  constructor() {
    super('Categorisation task list')
  }

  offendingHistoryButton = (): PageElement => cy.get('#offendingHistoryButton')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TaskListPage()
  }
}
