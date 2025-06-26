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

  categoryDecisionButton = (): PageElement => cy.get('#decisionButton')
  escapeButton = (): PageElement => cy.get('#escapeButton')
  extremismButton = (): PageElement => cy.get('#extremismButton')
  furtherChargesButton = (): PageElement => cy.get('#furtherChargesButton')
  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  offendingHistoryButton = (): PageElement => cy.get('#offendingHistoryButton')
  openConditionsButton = (): PageElement => cy.get('#openConditionsButton')
  securityButton = (): PageElement => cy.get('#securityButton')
  violenceButton = (): PageElement => cy.get('#violenceButton')
  supervisorMessageButton = (): PageElement => cy.get('#supervisorMessageButton')

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

  validateSummarySectionText = (expectedText: string[]) =>
    expectedText.forEach(text => {
      cy.get('#review').should('contain.text', text)
    })

  continueReviewAndCategorisationButton = (bookingId: number, expectedButtonText = 'Continue') =>
    cy.contains(`a[href="/form/categoriser/review/${bookingId}"]`, expectedButtonText)

  smartSurveyLink = () => cy.get('#smartSurveyLink')
}
