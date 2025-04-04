import Page, { PageElement } from '../../page'

const sexualOffencesRadioChoiceHtmlSelectors = {
  YES: '#haveTheyBeenEverConvicted',
  NO: '#haveTheyBeenEverConvicted-2',
} as const

type SexualOffencesChoice = keyof typeof sexualOffencesRadioChoiceHtmlSelectors
type SexualOffencesChoiceValues =
  | typeof sexualOffencesRadioChoiceHtmlSelectors.YES
  | typeof sexualOffencesRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  SEXUAL_OFFENCES: {
    ERROR: '#haveTheyBeenEverConvicted-error',
  },
}

export default class SexualOffencesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/sexualOffences/${this._bookingId}`
  }

  constructor() {
    super('Sexual offence')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SexualOffencesPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: SexualOffencesChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.SEXUAL_OFFENCES.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateSexualOffencesRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: SexualOffencesChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => sexualOffencesRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectSexualOffencesRadioButton = (selectedTextValue: SexualOffencesChoice): PageElement =>
    cy.get(sexualOffencesRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
