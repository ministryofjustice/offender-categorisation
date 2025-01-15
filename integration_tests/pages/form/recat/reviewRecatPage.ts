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
    this.validateDescriptionList('securityInputSummary', [
      { question: 'Security information', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateRiskAssessmentSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskAssessmentSummary', [
      { question: 'Risk assessment', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateCategoryDecisionSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('assessmentSummary', [
      { question: 'Category decision', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateNextReviewDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('nextReviewDateSummary', [
      { question: 'Next category review date', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateRiskOfHarmSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskOfHarmSummary', [
      { question: 'Risk of serious harm', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [
      { question: 'Earliest release date', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateVictimContactSchemeSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('victimContactSchemeSummary', [
      { question: 'Victim Contact Scheme (VCS)', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateForeignNationalSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('foreignNationalSummary', [
      { question: 'Foreign national', expectedAnswer: '' },
      ...expected,
    ])
  }

  validateRiskLevelSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskLevelSummary', [
      { question: 'Risk of escaping or absconding', expectedAnswer: '' },
      ...expected,
    ])
  }
}
