import Page, { DtDlQuestionExpectedAnswerPair, PageElement } from '../../page'

export default class ReviewRecatPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/recat/review/${this._bookingId}`
  }

  constructor() {
    super('Check your answers before submitting')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ReviewRecatPage()
  }

  saveAndSubmitButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and submit')

  changeLinks = (): PageElement => cy.get('a.govuk-link').filter(':contains("Change")')

  validateSecurityInputSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('securityInputSummary', [...expected])
  }

  validateRiskAssessmentSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskAssessmentSummary', [...expected])
  }

  validateCategoryDecisionSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('assessmentSummary', [...expected])
  }

  validateNextReviewDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('nextReviewDateSummary', [...expected])
  }

  validateRiskOfHarmSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskOfHarmSummary', [...expected])
  }

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [...expected])
  }

  validateVictimContactSchemeSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('victimContactSchemeSummary', [...expected])
  }

  validateForeignNationalSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('foreignNationalSummary', [...expected])
  }

  validateRiskLevelSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskLevelSummary', [...expected])
  }
}
