import Page, { PageElement } from '../page'

export default class TasklistRecatPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklistRecat/${this._bookingId}`
  }

  constructor() {
    super('Category review task list')
  }

  prisonerBackgroundButton = (): PageElement => cy.get('#prisonerBackgroundButton')
  oasysInputButton = (): PageElement => cy.get('#oasysInputButton')
  securityButton = (): PageElement => cy.get('#securityButton')
  riskAssessmentButton = (): PageElement => cy.get('#riskAssessmentButton')
  decisionButton = (): PageElement => cy.get('#decisionButton')
  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  openConditionsButton = (): PageElement => cy.get('#openConditionsButton')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TasklistRecatPage()
  }

  checkAndSubmitButton = (bookingId: number, expectedButtonText = 'Continue') =>
    cy.contains(`a[href="/form/recat/review/${bookingId}"]`, expectedButtonText)
}
