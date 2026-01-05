import Page, { PageElement } from '../../page'

const shouldBeInCatBRadioChoiceHtmlSelectors = {
  YES: '#escapeCatB',
  NO: '#escapeCatB-2',
} as const

const otherEvidenceRadioChoiceHtmlSelectors = {
  YES: '#escapeOtherEvidence',
  NO: '#escapeOtherEvidence-2',
} as const

type ShouldBeInCatBChoice = keyof typeof shouldBeInCatBRadioChoiceHtmlSelectors
type ShouldBeInCatBChoiceValues =
  | typeof shouldBeInCatBRadioChoiceHtmlSelectors.YES
  | typeof shouldBeInCatBRadioChoiceHtmlSelectors.NO

type OtherEvidenceChoice = keyof typeof otherEvidenceRadioChoiceHtmlSelectors
type OtherEvidenceChoiceValues =
  | typeof otherEvidenceRadioChoiceHtmlSelectors.YES
  | typeof otherEvidenceRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  ALERT: '.govuk-details__text p',
  INFO: '.govuk-inset-text',
  WARNING: '.moj-alert--warning',
  CAT_B: {
    ERROR: '#escapeCatB-error',
    QUESTION: 'input[name="escapeCatB"]',
    TEXT_ERROR: '#escapeCatBText-error',
    TEXTAREA: '#escapeCatBText',
  },
  ESCAPE_RISK: {
    ERROR: '#escapeOtherEvidence-error',
    TEXT_ERROR: '#escapeOtherEvidenceText-error',
    TEXTAREA: '#escapeOtherEvidenceText',
  },
}

export default class EscapePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/escapeRating/${this._bookingId}`
  }

  constructor() {
    super('Risk of escape')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new EscapePage()
  }

  validCategoryBQuestionVisibility({ isVisible }: { isVisible: boolean }) {
    cy.get(SELECTORS.CAT_B.QUESTION).then(input => {
      expect(input.attr('type') !== 'hidden').to.be.eq(isVisible)
    })
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

  validateAlerts(alerts: string[]) {
    alerts.forEach(alert => {
      cy.get(SELECTORS.ALERT)
        .invoke('text')
        .then(text => {
          expect(this._cleanString(text)).to.contains(alert)
        })
    })
  }

  validateFormTextContains = (expected: string) =>
    cy
      .get('form')
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | ShouldBeInCatBChoiceValues
        | OtherEvidenceChoiceValues
        | typeof SELECTORS.CAT_B.TEXTAREA
        | typeof SELECTORS.ESCAPE_RISK.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector:
        | typeof SELECTORS.CAT_B.ERROR
        | typeof SELECTORS.CAT_B.TEXT_ERROR
        | typeof SELECTORS.ESCAPE_RISK.ERROR
        | typeof SELECTORS.ESCAPE_RISK.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateShouldBeInCategoryBRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: ShouldBeInCatBChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => shouldBeInCatBRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateOtherEvidenceBRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: OtherEvidenceChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => otherEvidenceRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateShouldBeInCategoryBTextAreaContent = expected =>
    cy
      .get(SELECTORS.CAT_B.TEXTAREA)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  selectShouldBeInCategoryBRadioButton = (selectedTextValue: ShouldBeInCatBChoice): PageElement =>
    cy.get(shouldBeInCatBRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectOtherEvidenceBRadioButton = (selectedTextValue: OtherEvidenceChoice): PageElement =>
    cy.get(otherEvidenceRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setCatBText = (text: string) => cy.get(SELECTORS.CAT_B.TEXTAREA).type(text)

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')
}
