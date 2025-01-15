import Page, { PageElement } from '../../../page'

export default class CategoriserEscapePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/escapeRating/${this._bookingId}`
  }

  constructor() {
    super('Risk of escape')
  }

  warningText = (): PageElement => cy.get('div.govuk-warning-text')
  infoText = (): PageElement => cy.get('div.govuk-inset-text')
  alertInfoText = (): PageElement => cy.get('.govuk-details__text p')
  saveButton = (): PageElement => cy.get('button.govuk-button')
  escapeCatBQuestion = (): PageElement => cy.get('input[name="escapeCatB"]')
  escapeCatBTextarea = (): PageElement => cy.get('#escapeCatBText')
  escapeOtherEvidenceRadio = (): PageElement => cy.get('input[name="escapeOtherEvidence"]')
  escapeOtherEvidenceTextarea = (): PageElement => cy.get('#escapeOtherEvidenceText')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserEscapePage()
  }
}
