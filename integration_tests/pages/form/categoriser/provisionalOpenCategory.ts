import Page, { PageElement } from '../../page'

export default class ProvisionalCategoryOpenPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/provisionalCategory`
  }

  constructor() {
    super('Provisional category')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ProvisionalCategoryOpenPage()
  }

  warning = (): PageElement => cy.get('div.govuk-warning-text')

  form = (): PageElement => cy.get('form')

  appropriateYes = (): PageElement => cy.get('#openConditionsCategoryAppropriate')

  appropriateNo = (): PageElement => cy.get('#openConditionsCategoryAppropriate-2')

  newCatMessage = (): PageElement => cy.get('h2.govuk-heading-m')

  overriddenCategoryText = (): PageElement => cy.get('#overriddenCategoryText')

  otherInformationText = (): PageElement => cy.get('#otherInformationText')

  indeterminateWarning = (): PageElement => cy.get('#indeterminateWarning')

  submitButton = (): PageElement => cy.get('button').contains('Submit')

  errorSummaries = (): PageElement => cy.get('ul.govuk-error-summary__list li')

  errors = (): PageElement => cy.get('.govuk-error-message')
}
