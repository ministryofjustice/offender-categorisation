import Page, { PageElement } from '../../page'

const foreignNationalRadioChoiceHtmlSelectors = {
  YES: '#isForeignNational',
  NO: '#isForeignNational-2',
} as const

type ForeignNationalChoice = keyof typeof foreignNationalRadioChoiceHtmlSelectors
type ForeignNationalChoiceValues =
  | typeof foreignNationalRadioChoiceHtmlSelectors.YES
  | typeof foreignNationalRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  FOREIGNNATIONAL: {
    ERROR: '#isForeignNational-error',
  },
}

export default class ForeignNationalPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/foreignNational/${this._bookingId}`
  }

  constructor() {
    super('Foreign national')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ForeignNationalPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: ForeignNationalChoiceValues
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.FOREIGNNATIONAL.ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateForeignNationalRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: ForeignNationalChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => foreignNationalRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  selectForeignNationalRadioButton = (selectedTextValue: ForeignNationalChoice): PageElement =>
    cy.get(foreignNationalRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
