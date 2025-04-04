import Page, { PageElement } from '../../page'

const securityInputRadioChoiceHtmlSelectors = {
  YES: '#securityInputNeeded',
  NO: '#securityInputNeeded-2',
} as const

type SecurityInputChoice = keyof typeof securityInputRadioChoiceHtmlSelectors
type SecurityInputChoiceValues =
  | typeof securityInputRadioChoiceHtmlSelectors.YES
  | typeof securityInputRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  INFO: '.govuk-inset-text',
  WARNING: '.govuk-warning-text__text',
  SECURITY_INPUT_NEEDED: {
    ERROR: '#securityInputNeededText-error',
    TEXT_ERROR: '#securityInputNeededText-error',
    TEXTAREA: '#securityInputNeededText',
  },
}

export default class CategoriserSecurityInputPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/securityInput/${this._bookingId}`
  }

  constructor() {
    super('Security information')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserSecurityInputPage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: SecurityInputChoiceValues | typeof SELECTORS.SECURITY_INPUT_NEEDED.TEXTAREA
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.SECURITY_INPUT_NEEDED.ERROR | typeof SELECTORS.SECURITY_INPUT_NEEDED.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateSecurityInputRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: SecurityInputChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => securityInputRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateSecurityInputTextBox = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    this.validateSelectorVisibility(SELECTORS.SECURITY_INPUT_NEEDED.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.SECURITY_INPUT_NEEDED.TEXTAREA).should('contain.text', expectedText)
    }
  }

  selectSecurityInputRadioButton = (selectedTextValue: SecurityInputChoice): PageElement =>
    cy.get(securityInputRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setSecurityInputText = (text: string) => cy.get(SELECTORS.SECURITY_INPUT_NEEDED.TEXTAREA).type(text)
}
