import Page, { PageElement } from '../../page'

const nextReviewRadioChoiceHtmlSelectors = {
  IN_SIX_MONTHS: '#nextDateChoice',
  IN_TWELVE_MONTHS: '#nextDateChoice-2',
  ENTER_A_SPECIFIC_DATE: '#nextDateChoice-3',
} as const

export type NextReviewChoice = keyof typeof nextReviewRadioChoiceHtmlSelectors
type NextReviewChoiceValues =
  | typeof nextReviewRadioChoiceHtmlSelectors.IN_SIX_MONTHS
  | typeof nextReviewRadioChoiceHtmlSelectors.IN_TWELVE_MONTHS
  | typeof nextReviewRadioChoiceHtmlSelectors.ENTER_A_SPECIFIC_DATE

const SELECTORS = {
  NEXT_REVIEW: {
    ERROR: '#nextReviewText-error',
  },
}

export default class NextReviewQuestionPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/nextReviewDate/nextReviewDateQuestion/${this._bookingId}`
  }

  constructor() {
    super('When should they next be reviewed by?')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new NextReviewQuestionPage()
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: NextReviewChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.NEXT_REVIEW.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateReviewDateRadioButton = ({ selection, isChecked }: { selection: NextReviewChoice[]; isChecked: boolean }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => nextReviewRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  selectNextReviewRadioButton = (selectedTextValue: NextReviewChoice): PageElement =>
    cy.get(nextReviewRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
