import Page, { PageElement } from '../../page'

const furtherChargesRadioChoiceHtmlSelectors = {
  YES: '#furtherCharges',
  NO: '#furtherCharges-2',
} as const

type FurtherChargesChoice = keyof typeof furtherChargesRadioChoiceHtmlSelectors
type FurtherChargesChoiceValues =
  | typeof furtherChargesRadioChoiceHtmlSelectors.YES
  | typeof furtherChargesRadioChoiceHtmlSelectors.NO

const furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors = {
  YES: '#furtherChargesCatB',
  NO: '#furtherChargesCatB-2',
} as const

export type FurtherChargesCategoryBAppropriateChoice =
  keyof typeof furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors
type FurtherChargesCategoryBAppropriateChoiceValues =
  | typeof furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors.YES
  | typeof furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors.NO

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
    ERROR: '#furtherChargesText-error',
    ERROR_CAT_B: '#furtherChargesCatB-error',
    TEXT_ERROR: '#furtherChargesText-error',
    TEXTAREA: '#furtherChargesText',
  },
}

export default class FurtherChargesPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/furtherCharges/${this._bookingId}`
  }

  constructor() {
    super('Further charges')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new FurtherChargesPage()
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | FurtherChargesChoiceValues
        | FurtherChargesCategoryBAppropriateChoiceValues
        | typeof SELECTORS.FURTHER_CHARGES.TEXTAREA
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.FURTHER_CHARGES.ERROR | typeof SELECTORS.FURTHER_CHARGES.TEXT_ERROR
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

  validateFurtherChargesCategoryBAppropriateRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: FurtherChargesCategoryBAppropriateChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateFurtherChargesCategoryBAppropriateTextBox = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(SELECTORS.FURTHER_CHARGES.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.FURTHER_CHARGES.TEXTAREA).should('contain.text', expectedText)
    }
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  continue = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  selectFurtherChargesRadioButton = (selectedTextValue: FurtherChargesChoice): PageElement =>
    cy.get(furtherChargesRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectFurtherChargesCategoryBAppropriateRadioButton = (
    selectedTextValue: FurtherChargesCategoryBAppropriateChoice,
  ): PageElement => cy.get(furtherChargesCategoryBAppropriateRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setFurtherChargesCategoryBAppropriateText = (text: string) => cy.get(SELECTORS.FURTHER_CHARGES.TEXTAREA).type(text)

  clearFurtherChargesCategoryBAppropriateText = () => cy.get(SELECTORS.FURTHER_CHARGES.TEXTAREA).clear()

  selectIncreasedRiskRadioButton = (selectedTextValue: IncreasedRiskChoice): PageElement =>
    cy.get(increasedRiskRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
