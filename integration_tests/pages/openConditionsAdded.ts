import Page, { PageElement } from './page'

export default class OpenConditionsAdded extends Page {
  constructor() {
    super('Open conditions assessment added to your task list')
  }

  returnToTasklistButton = (bookingId: number): PageElement =>
    cy.contains(`a[href="/tasklist/${bookingId}"]`, 'Return to task list')
}
