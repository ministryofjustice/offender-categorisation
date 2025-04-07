import Page, { PageElement } from '../../page'

export default class ProvisionalCategoryPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/categoriser/provisionalCategory`
  }

  constructor() {
    super('Provisional category')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ProvisionalCategoryPage()
  }

  openConditionsAppropriateYes = (): PageElement => cy.get('#openConditionsCategoryAppropriate')

  appropriateYes = (): PageElement => cy.get('#categoryAppropriate')

  appropriateNo = (): PageElement => cy.get('#categoryAppropriate-2')

  overriddenCategoryD = (): PageElement => cy.get('#overriddenCategoryD')

  setOverriddenCategoryText = (overriddenText: string): PageElement =>
    cy.get('#overriddenCategoryText').type(overriddenText, { delay: 0 })

  setOtherInformationText = (otherInformationText: string): PageElement =>
    cy.get('#otherInformationText').type(otherInformationText, { delay: 0 })

  submitButton = (): PageElement => cy.get('button[type="submit"]')

  indeterminateWarning = (): PageElement => cy.get('#indeterminateWarning')

  warning = (): PageElement => cy.get('div.govuk-warning-text')
}
