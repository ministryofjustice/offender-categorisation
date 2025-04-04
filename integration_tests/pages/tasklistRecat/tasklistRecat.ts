import Page, { PageElement } from '../page'
import moment from 'moment/moment'

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
  supervisorMessageButton = (): PageElement => cy.get('#supervisorMessageButton')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TasklistRecatPage()
  }

  checkAndSubmitButton = (bookingId: number, expectedButtonText = 'Continue') =>
    cy.contains(`a[href="/form/recat/review/${bookingId}"]`, expectedButtonText)

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

  validateSummarySection = () => {
    cy.get('#review').contains('Check and submit')
    cy.get('#review').contains('All tasks completed')
  }
}
