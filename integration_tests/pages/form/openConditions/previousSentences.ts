import Page, { PageElement } from '../../page'

const previousSentencesRadioChoiceHtmlSelectors = {
  YES: '#releasedLastFiveYears',
  NO: '#releasedLastFiveYears-2',
} as const

type PreviousSentencesChoice = keyof typeof previousSentencesRadioChoiceHtmlSelectors
type PreviousSentencesChoiceValues =
  | typeof previousSentencesRadioChoiceHtmlSelectors.YES
  | typeof previousSentencesRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  RELEASED_LAST_FIVE_YEARS: {
    ERROR: '#releasedLastFiveYears-error',
  },
}

export default class PreviousSentencesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/previousSentences/${this._bookingId}`
  }

  constructor() {
    super('Previous sentences')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new PreviousSentencesPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: PreviousSentencesChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.RELEASED_LAST_FIVE_YEARS.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validatePreviousSentencesRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: PreviousSentencesChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => previousSentencesRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectPreviousSentencesRadioButton = (selectedTextValue: PreviousSentencesChoice): PageElement =>
    cy.get(previousSentencesRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
