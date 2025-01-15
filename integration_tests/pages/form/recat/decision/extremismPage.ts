import Page, { PageElement } from '../../../page'

export default class ExtremismPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/extremismRating`
  }

  constructor() {
    super('Extremism')
  }

  warningMessage = (): PageElement => cy.get('div.govuk-warning-text')
  infoText = (): PageElement => cy.get('div.govuk-inset-text')
  form = (): PageElement => cy.get('form')
  previousTerrorismOffencesYes = (): PageElement => cy.get('#previousTerrorismOffences')
  previousTerrorismOffencesNo = (): PageElement => cy.get('#previousTerrorismOffences-2')
  previousTerrorismOffencesText = (): PageElement => cy.get('#previousTerrorismOffencesText')
  submitButton = (): PageElement => cy.get('button[type="submit"]')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')
}
