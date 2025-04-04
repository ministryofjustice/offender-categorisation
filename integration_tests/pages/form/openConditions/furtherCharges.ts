import Page, { PageElement } from '../../page'

const furtherChargesRadioChoiceHtmlSelectors = {
  YES: '#furtherCharges',
  NO: '#furtherCharges-2',
} as const

type FurtherChargesChoice = keyof typeof furtherChargesRadioChoiceHtmlSelectors
type FurtherChargesChoiceValues =
  | typeof furtherChargesRadioChoiceHtmlSelectors.YES
  | typeof furtherChargesRadioChoiceHtmlSelectors.NO

const increasedRiskRadioChoiceHtmlSelectors = {
  YES: '#increasedRisk',
  NO: '#increasedRisk-2',
} as const

type IncreasedRiskChoice = keyof typeof increasedRiskRadioChoiceHtmlSelectors
type IncreasedRiskChoiceValues =
  | typeof increasedRiskRadioChoiceHtmlSelectors.YES
  | typeof increasedRiskRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  FURTHER_CHARGES: {
    ERROR: '#furtherCharges-error',
  },
  FURTHER_CHARGE_DETAILS: {
    TEXTAREA: '#furtherChargesText',
  },
}

export default class FurtherChargesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/furtherCharges/${this._bookingId}`
  }

  constructor() {
    super('Further charges')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new FurtherChargesPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: FurtherChargesChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.FURTHER_CHARGES.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateFurtherChargesRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: FurtherChargesChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => furtherChargesRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectFurtherChargesRadioButton = (selectedTextValue: FurtherChargesChoice): PageElement =>
    cy.get(furtherChargesRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectIncreasedRiskRadioButton = (selectedTextValue: IncreasedRiskChoice): PageElement =>
    cy.get(increasedRiskRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setFurtherChargeDetailsTextInput = (text: string): PageElement =>
    cy.get(SELECTORS.FURTHER_CHARGE_DETAILS.TEXTAREA).type(text, { delay: 0 })
}
