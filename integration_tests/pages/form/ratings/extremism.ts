import Page, { PageElement } from '../../page'

const previousTerrorismOffencesRadioChoiceHtmlSelectors = {
  YES: '#previousTerrorismOffences',
  NO: '#previousTerrorismOffences-2',
} as const

type PreviousTerrorismOffencesChoice = keyof typeof previousTerrorismOffencesRadioChoiceHtmlSelectors
type PreviousTerrorismOffencesChoiceValues =
  | typeof previousTerrorismOffencesRadioChoiceHtmlSelectors.YES
  | typeof previousTerrorismOffencesRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  INFO: '.govuk-inset-text',
  WARNING: '.moj-alert--warning',
  PREVIOUS_TERRORISM_OFFENCES: {
    ERROR: '#previousTerrorismOffencesText-error',
    TEXT_ERROR: '#previousTerrorismOffencesText-error',
    TEXTAREA: '#previousTerrorismOffencesText',
  },
}

export default class ExtremismPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/extremism/${this._bookingId}`
  }

  constructor() {
    super('Extremism')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ExtremismPage()
  }

  validateInfoVisibility({ isVisible }: { isVisible: boolean }) {
    cy.get(SELECTORS.INFO).should(isVisible ? 'exist' : 'not.exist')
  }

  validateInfoText = (expected: string) =>
    cy
      .get(SELECTORS.INFO)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateWarningVisibility({ isVisible }: { isVisible: boolean }) {
    cy.get(SELECTORS.WARNING).should(isVisible ? 'exist' : 'not.exist')
  }

  validateWarningText = (expected: string) =>
    cy
      .get(SELECTORS.WARNING)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validatePreviousTerrorismOffencesRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: PreviousTerrorismOffencesChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => previousTerrorismOffencesRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validatePreviousTerrorismOffencesTextBox = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(SELECTORS.PREVIOUS_TERRORISM_OFFENCES.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.PREVIOUS_TERRORISM_OFFENCES.TEXTAREA).should('contain.text', expectedText)
    }
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: PreviousTerrorismOffencesChoiceValues | typeof SELECTORS.PREVIOUS_TERRORISM_OFFENCES.TEXTAREA
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector:
        | typeof SELECTORS.PREVIOUS_TERRORISM_OFFENCES.ERROR
        | typeof SELECTORS.PREVIOUS_TERRORISM_OFFENCES.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  selectPreviousTerrorismOffencesRadioButton = (selectedTextValue: PreviousTerrorismOffencesChoice): PageElement =>
    cy.get(previousTerrorismOffencesRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setPreviousTerrorismOffencesText = (text: string) => cy.get(SELECTORS.PREVIOUS_TERRORISM_OFFENCES.TEXTAREA).type(text)
}
