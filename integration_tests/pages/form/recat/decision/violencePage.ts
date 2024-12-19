import Page, { PageElement } from '../../../page'

export default class ViolencePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/violenceRating`
  }

  constructor() {
    super('Safety and good order')
  }

  warning = (): PageElement => cy.get('div.govuk-warning-text')
  infoText = (): PageElement => cy.get('div.govuk-inset-text')
  form = (): PageElement => cy.get('form')
  highRiskOfViolenceYes = (): PageElement => cy.get('#highRiskOfViolence')
  highRiskOfViolenceNo = (): PageElement => cy.get('#highRiskOfViolence-2')
  highRiskOfViolenceText = (): PageElement => cy.get('#highRiskOfViolenceText')
  seriousThreatYes = (): PageElement => cy.get('#seriousThreat')
  seriousThreatNo = (): PageElement => cy.get('#seriousThreat-2')
  seriousThreatText = (): PageElement => cy.get('#seriousThreatText')
  submitButton = (): PageElement => cy.get('button[type="submit"]')
  backLink = (): PageElement => cy.get('a.govuk-back-link')
  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')
  errors = (): PageElement => cy.get('.govuk-error-message')
}
