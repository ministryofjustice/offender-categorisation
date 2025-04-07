import Page, { PageElement } from '../../page'

const SELECTORS = {
  REVIEW_DATE: {
    INPUT: '#reviewDate',
    ERROR: '#reviewDate-error',
    ERROR_SUMMARY: '#date',
  },
}

export type NextDateChoice = '6' | '12' | 'SPECIFIC'

export default class NextReviewConfirmationPage extends Page {
  private static _bookingId: number
  private static _nextDateChoice: NextDateChoice

  static get baseUrl(): string {
    return `/form/nextReviewDate/nextReviewDate/${this._bookingId}?nextDateChoice=${this._nextDateChoice}`
  }

  constructor() {
    super('Confirm the date they should be reviewed by')
  }

  static createForBookingIdAndChoiceNumber = (bookingId: number, nextDateChoice: NextDateChoice) => {
    this._bookingId = bookingId
    this._nextDateChoice = nextDateChoice
    return new NextReviewConfirmationPage()
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: typeof SELECTORS.REVIEW_DATE.ERROR_SUMMARY
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.REVIEW_DATE.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  clearReviewDateInputValue = () => cy.get(SELECTORS.REVIEW_DATE.INPUT).clear()

  setReviewDateInputValue = (text: string) => cy.get(SELECTORS.REVIEW_DATE.INPUT).clear().type(text)

  validateReviewDateInputValue = (expectedReviewDate: string): PageElement =>
    cy.get(SELECTORS.REVIEW_DATE.INPUT).should('have.value', expectedReviewDate)
}
