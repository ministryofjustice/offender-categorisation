import Page, { PageElement } from '../../page'

const confirmationRadioChoiceHtmlSelectors = {
  YES: '#confirmation',
  NO: '#confirmation-2',
} as const

type ConfirmationChoice = keyof typeof confirmationRadioChoiceHtmlSelectors
type ConfirmationChoiceValues =
  | typeof confirmationRadioChoiceHtmlSelectors.YES
  | typeof confirmationRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  CONFIRMATION: {
    ERROR: '#confirmation-error',
    TEXT_ERROR: '#messageText-error',
    TEXTAREA: '#messageText',
  },
}

export default class SupervisorConfirmBackPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/supervisor/confirmBack/${this._bookingId}`
  }

  constructor() {
    super('Confirm status change')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SupervisorConfirmBackPage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: ConfirmationChoiceValues | typeof SELECTORS.CONFIRMATION.TEXTAREA
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.CONFIRMATION.ERROR | typeof SELECTORS.CONFIRMATION.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateConfirmationRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: ConfirmationChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => confirmationRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectConfirmationRadioButton = (selectedTextValue: ConfirmationChoice): PageElement =>
    cy.get(confirmationRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setConfirmationMessageText = (text: string) => cy.get(SELECTORS.CONFIRMATION.TEXTAREA).type(text)

  validateConfirmationMessageTextBox = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    this.validateSelectorVisibility(SELECTORS.CONFIRMATION.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.CONFIRMATION.TEXTAREA).should('contain.text', expectedText)
    }
  }
}
