import Page, { PageElement } from '../../page'

const earliestReleaseDateRadioChoiceHtmlSelectors = {
  YES: '#fiveOrMoreYears',
  NO: '#fiveOrMoreYears-2',
} as const

type EarliestReleaseDateChoice = keyof typeof earliestReleaseDateRadioChoiceHtmlSelectors
type EarliestReleaseDateChoiceValues =
  | typeof earliestReleaseDateRadioChoiceHtmlSelectors.YES
  | typeof earliestReleaseDateRadioChoiceHtmlSelectors.NO

const justifyOpenConditionsRadioChoiceHtmlSelectors = {
  YES: '#justify',
  NO: '#justify-2',
} as const

type JustifyOpenConditionsChoice = keyof typeof justifyOpenConditionsRadioChoiceHtmlSelectors
type JustifyOpenConditionsChoiceValues =
  | typeof justifyOpenConditionsRadioChoiceHtmlSelectors.YES
  | typeof justifyOpenConditionsRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  EARLIEST_RELEASE_DATE: {
    ERROR: '#fiveOrMoreYears-error',
  },
  JUSTIFY_OPEN_CONDITIONS: {
    TEXTAREA: '#justifyText',
  },
} as const

export default class EarliestReleaseDatePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/earliestReleaseDate/${this._bookingId}`
  }

  constructor() {
    super('Earliest release date')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new EarliestReleaseDatePage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | EarliestReleaseDateChoiceValues
        | JustifyOpenConditionsChoiceValues
        | typeof SELECTORS.JUSTIFY_OPEN_CONDITIONS.TEXTAREA
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.EARLIEST_RELEASE_DATE.ERROR | '#justify-error' | '#justifyText-error'
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateEarliestReleaseDateRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: EarliestReleaseDateChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => earliestReleaseDateRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectEarliestReleaseDateRadioButton = (selectedTextValue: EarliestReleaseDateChoice): PageElement =>
    cy.get(earliestReleaseDateRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectJustifyRadioButton = (selectedTextValue: JustifyOpenConditionsChoice): PageElement =>
    cy.get(justifyOpenConditionsRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setJustifyOpenConditionsTextInput = (justification: string): PageElement =>
    cy.get(SELECTORS.JUSTIFY_OPEN_CONDITIONS.TEXTAREA).type(justification, { delay: 0 })
}
