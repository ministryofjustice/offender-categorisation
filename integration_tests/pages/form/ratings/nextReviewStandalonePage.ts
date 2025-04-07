import Page, { PageElement } from '../../page'

const nextReviewDateHtmlSelectors = {
  NEW_DATE: '#date',
  REASON: '#reason',
} as const

type NextReviewDateValues = typeof nextReviewDateHtmlSelectors.NEW_DATE | typeof nextReviewDateHtmlSelectors.REASON

const SELECTORS = {
  DATE: '#date',
  DATE_ERROR: '#reviewDate-error',
  REASON: '#reason',
  REASON_ERROR: '#reason-error',
  REVIEW_DATE: '#reviewDate',
} as const

export default class NextReviewStandalonePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/nextReviewDate/nextReviewDateStandalone/${this._bookingId}`
  }

  constructor() {
    super('Change the review date')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new NextReviewStandalonePage()
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: NextReviewDateValues
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.DATE_ERROR | typeof SELECTORS.REASON_ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Submit')

  checkCurrentReviewInsetText = (isoDate: string): void => {
    const dateParts = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(new Date(isoDate))

    // GOV.UK style: no comma after weekday
    const formattedDate = [
      dateParts.find(p => p.type === 'weekday')?.value,
      dateParts.find(p => p.type === 'day')?.value,
      dateParts.find(p => p.type === 'month')?.value,
      dateParts.find(p => p.type === 'year')?.value,
    ].join(' ')

    cy.contains(`Current review date: ${formattedDate}`)
  }

  clearNewReviewDateInput = (): PageElement => cy.get(SELECTORS.REVIEW_DATE).clear()

  clearNewReviewReasonTextInput = (): PageElement => cy.get(SELECTORS.REASON).clear()

  setNewReviewDateInput = (newReviewDate: string) => cy.get(SELECTORS.REVIEW_DATE).type(newReviewDate)

  setNewReviewReasonTextInput = (newReviewReason: string): PageElement =>
    cy.get(SELECTORS.REASON).type(newReviewReason, { delay: 0 })
}
