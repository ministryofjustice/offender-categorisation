import Page, { PageElement } from '../page'

const SELECTORS = {
  BUTTON: {
    REFER_TO_SECURITY: '#securityButton',
    CANCEL_SECURITY_REFERRAL: '#securityCancelLink',
  },
}

export default class SecurityLandingPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/securityLanding/${this._bookingId}`
  }

  constructor() {
    super()
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SecurityLandingPage()
  }

  verifyPageHeading = (heading: string): PageElement => cy.get('h2').contains(heading)
  referButton = (): PageElement => cy.get(SELECTORS.BUTTON.REFER_TO_SECURITY).contains('Refer')
  cancelButton = (): PageElement => cy.get(SELECTORS.BUTTON.CANCEL_SECURITY_REFERRAL).contains('Cancel referral')
}
