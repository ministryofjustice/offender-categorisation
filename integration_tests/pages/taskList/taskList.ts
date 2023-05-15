import Page, { PageElement } from '../page'

export default class TaskListPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklist/${this._bookingId}`
  }

  constructor() {
    super('Categorisation task list')
  }

  categoryDecisionButton = (): PageElement => cy.get('#decisionButton')
  escapeButton = (): PageElement => cy.get('#escapeButton')
  extremismButton = (): PageElement => cy.get('#extremismButton')
  furtherChargesButton = (): PageElement => cy.get('#furtherChargesButton')
  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  offendingHistoryButton = (): PageElement => cy.get('#offendingHistoryButton')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TaskListPage()
  }
}
