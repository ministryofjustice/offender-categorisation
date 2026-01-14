import { PageElement } from '../page'
import BaseRecategoriserPage from './base'

export default class RiskProfileChangePage extends BaseRecategoriserPage {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/riskProfileChangeDetail/${this._bookingId}`
  }

  constructor() {
    super('Check change in risk status')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new RiskProfileChangePage()
  }

  confirmationYes = (): PageElement => cy.get('input[name="confirmation"][value="Yes"]')
  confirmationNo = (): PageElement => cy.get('input[name="confirmation"][value="No"]')
  submitButton = (): PageElement => cy.get('button[type="submit"]')
}
