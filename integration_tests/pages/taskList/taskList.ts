import Page, { PageElement } from '../page'
import moment from 'moment'

export default class TaskListPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklist/${this._bookingId}`
  }

  constructor() {
    super('Complete a categorisation')
  }

  categoryDecisionLink = (): PageElement => cy.get('#decisionLink')
  escapeLink = (): PageElement => cy.get('#escapeLink')
  extremismLink = (): PageElement => cy.get('#extremismLink')
  furtherChargesLink = (): PageElement => cy.get('#furtherChargesLink')
  nextReviewDateLink = (): PageElement => cy.get('#nextReviewDateLink')
  offendingHistoryLink = (): PageElement => cy.get('#offendingHistoryLink')
  openConditionsLink = (): PageElement => cy.get('#openConditionsLink')
  securityLink = (): PageElement => cy.get('#securityLink')
  violenceLink = (): PageElement => cy.get('#violenceLink')
  supervisorMessageLink = (): PageElement => cy.get('#supervisorMessageLink')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TaskListPage()
  }

  validateSecurityReferralDate = (date: Date) => {
    cy.get('#securitySection').should(
      'contain.text',
      `Manually referred to Security (${moment(date).format('DD/MM/yyyy')})`,
    )
  }

  checkAndSubmitCategorisationLink = (bookingId: number, expectedLinkText = 'Check and submit') =>
    cy.contains(`a[href="/form/categoriser/review/${bookingId}"]`, expectedLinkText)
}
