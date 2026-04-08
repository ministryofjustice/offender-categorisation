import { PageElement } from '../page'
import BaseLandingPage from '../baseLandingPage'

export default class CategoriserLandingPage extends BaseLandingPage {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/categoriserLanding/${this._bookingId}`
  }

  constructor() {
    super('Manage category')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserLandingPage()
  }

  initialButton = (): PageElement => cy.get('#initialButton')
  editButton = (): PageElement => cy.get('#editButton')
  historyButton = (): PageElement => cy.get('#historyButton')
  previousCategoryHeading = (): PageElement => cy.get('#previousCategoryHeading')
}
