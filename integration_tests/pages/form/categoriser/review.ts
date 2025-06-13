import Page, { DtDlQuestionExpectedAnswerPair, PageElement } from '../../page'

export default class CategoriserReviewCYAPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/categoriser/review/${this._bookingId}`
  }

  constructor() {
    super('Check your answers before you submit')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserReviewCYAPage()
  }

  changeLinks = (): PageElement => cy.get('a.govuk-link').filter(':contains("Change")')

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and submit')

  victimContactSchemeDl = (): PageElement => cy.get('.victimContactSchemeSummary.no-print')

  validateOffendingHistorySummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('offendingHistorySummary', [...expected])
  }

  validateFurtherChargesSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('furtherChargesSummary', [...expected])
  }

  validateViolenceRatingSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('violenceRatingSummary', [...expected])
  }

  validateEscapeRatingSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('escapeRatingSummary', [...expected])
  }

  validateExtremismRatingSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('extremismRatingSummary', [...expected])
  }

  validateSecurityInputSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('securityInputSummary', [...expected])
  }

  validateNextReviewDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('nextReviewDateSummary', [...expected])
  }

  validateEarliestReleaseDateSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('earliestReleaseDateSummary', [...expected])
  }

  validateVictimContactSchemeSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('victimContactSchemeSummary', [...expected])
  }

  validatePreviousSentencesSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('previousSentencesSummary', [...expected])
  }

  validateSexualOffencesSummarySummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('sexualOffencesSummary', [...expected])
  }

  validateForeignNationalSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('foreignNationalSummary', [...expected])
  }

  validateRiskOfHarmSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskOfHarmSummary', [...expected])
  }

  validateFurtherChargesOpenSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('furtherChargesOpenSummary', [...expected])
  }

  validateRiskLevelSummary = (expected: DtDlQuestionExpectedAnswerPair[]) => {
    this.validateDescriptionList('riskLevelSummary', [...expected])
  }
}
