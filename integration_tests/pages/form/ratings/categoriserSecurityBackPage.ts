import Page, { PageElement } from '../../page'

const warrantACategoryBRadioChoiceHtmlSelectors = {
  YES: '#catB',
  NO: '#catB-2',
} as const

export type WarrantACategoryBChoice = keyof typeof warrantACategoryBRadioChoiceHtmlSelectors
type WarrantACategoryBChoiceValues =
  | typeof warrantACategoryBRadioChoiceHtmlSelectors.YES
  | typeof warrantACategoryBRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  CAT_B_RADIO: 'input[name="catB"]',
  NOTE_FROM_SECURITY: 'div.govuk-inset-text',
  WARNING: 'div.govuk-warning-text',
}

export default class CategoriserSecurityBackPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/securityBack/${this._bookingId}`
  }

  constructor() {
    super('Security information')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserSecurityBackPage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  validateNoteFromSecurity = (expectedText: string[]) =>
    expectedText.forEach(expected =>
      cy
        .get(SELECTORS.NOTE_FROM_SECURITY)
        .invoke('text')
        .then(text => {
          expect(this._cleanString(text)).to.contains(expected)
        }),
    )

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: WarrantACategoryBChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.CAT_B_RADIO
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateSecurityInputRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: WarrantACategoryBChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => warrantACategoryBRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectedWarrantACategoryBRadioButton = (selectedTextValue: WarrantACategoryBChoice): PageElement =>
    cy.get(warrantACategoryBRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
