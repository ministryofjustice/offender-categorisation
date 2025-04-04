import Page, { PageElement } from '../../page'

const previousConvictionsRadioChoiceHtmlSelectors = {
  YES: '#previousConvictions',
  NO: '#previousConvictions-2',
} as const

type PreviousConvictionsChoice = keyof typeof previousConvictionsRadioChoiceHtmlSelectors

const SELECTORS = {
  CAT_A: {
    INFO: '.govuk-inset-text',
    WARNING: '.govuk-warning-text__text',
  },
  CONVICTIONS_LIST: '.govuk-body-s.forms-comments-text ul li',
  PREVIOUS_CONVICTIONS: '#previousConvictionsText',
}

export default class CategoriserOffendingHistoryPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/offendingHistory/${this._bookingId}`
  }

  constructor() {
    super('Offending history')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoriserOffendingHistoryPage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  selectPreviousConvictionsRadioButton = (selectedTextValue: PreviousConvictionsChoice): PageElement =>
    cy.get(previousConvictionsRadioChoiceHtmlSelectors[selectedTextValue]).click()

  validatePreviousConvictionRadioButtons = ({
    selection,
    isChecked,
  }: {
    selection: PreviousConvictionsChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => previousConvictionsRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateCatAWarningExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.CAT_A.WARNING, exists)

  validateExpectedCatAWarning = (expected: string) =>
    cy
      .get(SELECTORS.CAT_A.WARNING)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateCatAInfoExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.CAT_A.INFO, exists)

  validateExpectedCatAInfo = (expected: string) =>
    cy
      .get(SELECTORS.CAT_A.INFO)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateExpectedConvictions = (convictions: string[]) =>
    cy
      .get(SELECTORS.CONVICTIONS_LIST)
      .each(($li, index) => expect(this._cleanString($li.text())).to.contain(convictions[index]))

  validatePreviousConvictionsTextBox = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    this.validateSelectorVisibility(SELECTORS.PREVIOUS_CONVICTIONS, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.PREVIOUS_CONVICTIONS).should('contain.text', expectedText)
    }
  }

  setPreviousConvictionsText = (text: string) => cy.get(SELECTORS.PREVIOUS_CONVICTIONS).type(text)
}
