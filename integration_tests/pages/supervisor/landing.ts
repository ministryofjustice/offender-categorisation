import { PageElement } from '../page'
import BaseLandingPage from '../baseLandingPage'

export default class SupervisorLandingPage extends BaseLandingPage {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/supervisorLanding/${this._bookingId}`
  }

  constructor() {
    super('Check previous category reviews', { checkOnPage: { tag: 'h2' } })
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SupervisorLandingPage()
  }

  nextReviewDateButton = (): PageElement => cy.get('#nextReviewDateButton')
  paragraphs = (): PageElement => cy.get('p')
  approveButton = (): PageElement => cy.get('#approveButton')
}
