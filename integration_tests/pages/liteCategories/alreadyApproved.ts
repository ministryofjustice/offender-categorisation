import Page, { PageElement } from '../page'

const SELECTORS = {
  WARNING: '.govuk-warning-text__text',
  BUTTON: {
    FINISH: 'button',
  },
}

export default class LiteCategoriesAlreadyApprovedPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/liteCategories/alreadyApproved/${this._bookingId}`
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new LiteCategoriesAlreadyApprovedPage()
  }

  constructor() {
    super('What does this mean?', { checkOnPage: { tag: 'h2' } })
  }

  validateAlreadyApprovedWarningExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.WARNING, exists)

  validateExpectedAlreadyApprovedWarning = (expected: string) =>
    cy
      .get(SELECTORS.WARNING)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })
}
