import Page, { PageElement } from '../page'
import moment from 'moment/moment'

export default class TasklistRecatPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/tasklistRecat/${this._bookingId}`
  }

  constructor() {
    super('Complete a categorisation review')
  }

  prisonerBackgroundLink = (): PageElement => cy.get('#prisonerBackgroundLink')
  prevRiskAssessmentsLink = (): PageElement => cy.get('#prevRiskAssessmentsLink')
  securityLink = (): PageElement => cy.get('#securityLink')
  riskAssessmentLink = (): PageElement => cy.get('#riskAssessmentLink')
  categoryDecisionLink = (): PageElement => cy.get('#categoryDecisionLink')
  nextReviewDateLink = (): PageElement => cy.get('#nextReviewDateLink')
  openConditionsLink = (): PageElement => cy.get('#openConditionsLink')
  supervisorMessageLink = (): PageElement => cy.get('#supervisorMessageLink')

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
