import Page, { PageElement } from '../page'
import moment from 'moment'

export default class TaskListPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklist/${this._bookingId}`
  }

  constructor() {
    super('Categorisation task list')
  }

  categoryDecisionLink = (): PageElement => cy.get('#decisionLink')
  escapeLink = (): PageElement => cy.get('#escapeLink')
  extremismLink = (): PageElement => cy.get('#extremismLink')
  furtherChargesLink = (): PageElement => cy.get('#furtherChargesLink')
  // delete below when doing recat
  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  nextReviewDateLink = (): PageElement => cy.get('#nextReviewDateLink')
  offendingHistoryLink = (): PageElement => cy.get('#offendingHistoryLink')
  // delete below when doing recat
  openConditionsButton = (): PageElement => cy.get('#openConditionsButton')
  openConditionsLink = (): PageElement => cy.get('#openConditionsLink')
  // delete below when doing recat
  securityButton = (): PageElement => cy.get('#securityButton')
  securityLink = (): PageElement => cy.get('#securityLink')
  violenceLink = (): PageElement => cy.get('#violenceLink')
  // delete below when doing recat
  supervisorMessageButton = (): PageElement => cy.get('#supervisorMessageButton')
  supervisorMessageLink = (): PageElement => cy.get('#supervisorMessageLink')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TaskListPage()
  }

  validateButtonState({ buttonSelector, isDisabled }: { buttonSelector: () => PageElement; isDisabled: boolean }) {
    buttonSelector().should(isDisabled ? 'be.disabled' : 'not.be.disabled')
  }

  validateSecurityReferralDate = (date: Date) => {
    cy.get('#securitySection').should(
      'contain.text',
      `Manually referred to Security (${moment(date).format('DD/MM/yyyy')})`,
    )
  }

  validateSecurityCompletedDate = (date: Date) => {
    cy.get('#securitySection').should('contain.text', `Completed Security (${moment(date).format('DD/MM/yyyy')})`)
  }

  checkAndSubmitCategorisationLink = (bookingId: number, expectedLinkText = 'Check and submit') =>
    cy.contains(`a[href="/form/categoriser/review/${bookingId}"]`, expectedLinkText)
}
