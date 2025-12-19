import Page, { PageElement } from '../../page'

const highRiskOfViolenceRadioChoiceHtmlSelectors = {
  YES: '#highRiskOfViolence',
  NO: '#highRiskOfViolence-2',
} as const

type HighRiskOfViolenceChoice = keyof typeof highRiskOfViolenceRadioChoiceHtmlSelectors
type HighRiskOfViolenceChoiceValues =
  | typeof highRiskOfViolenceRadioChoiceHtmlSelectors.YES
  | typeof highRiskOfViolenceRadioChoiceHtmlSelectors.NO

const seriousThreatRadioChoiceHtmlSelectors = {
  YES: '#seriousThreat',
  NO: '#seriousThreat-2',
} as const

type SeriousThreatChoice = keyof typeof highRiskOfViolenceRadioChoiceHtmlSelectors
type SeriousThreatChoiceValues =
  | typeof seriousThreatRadioChoiceHtmlSelectors.YES
  | typeof seriousThreatRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  VIOLENCE: {
    INFO: '.govuk-inset-text',
    WARNING: '.moj-alert--warning',
  },
  HIGH_RISK_OF_VIOLENCE: {
    ERROR: '#highRiskOfViolence-error',
    TEXT_ERROR: 'highRiskOfViolenceText-error',
    TEXTAREA: '#highRiskOfViolenceText',
  },
  SERIOUS_THREAT: {
    ERROR: '#seriousThreat-error',
    TEXT_ERROR: 'seriousThreat-error',
    TEXTAREA: '#seriousThreatText',
  },
}

export default class ViolencePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/violenceRating/${this._bookingId}`
  }

  constructor() {
    super('Safety and good order')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ViolencePage()
  }

  saveAndReturnButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | HighRiskOfViolenceChoiceValues
        | SeriousThreatChoiceValues
        | typeof SELECTORS.HIGH_RISK_OF_VIOLENCE.TEXT_ERROR
        | typeof SELECTORS.SERIOUS_THREAT.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.HIGH_RISK_OF_VIOLENCE.ERROR | typeof SELECTORS.SERIOUS_THREAT.TEXT_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  selectHighRiskOfViolenceRadioButton = (selectedTextValue: HighRiskOfViolenceChoice): PageElement =>
    cy.get(highRiskOfViolenceRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectSeriousThreadRadioButton = (selectedTextValue: SeriousThreatChoice): PageElement =>
    cy.get(seriousThreatRadioChoiceHtmlSelectors[selectedTextValue]).click()

  validateHighRiskOfViolenceRadioButtons = ({
    selection,
    isChecked,
  }: {
    selection: HighRiskOfViolenceChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => highRiskOfViolenceRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateSeriousThreatRadioButtons = ({
    selection,
    isChecked,
  }: {
    selection: SeriousThreatChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => seriousThreatRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  validateViolenceWarningExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.VIOLENCE.WARNING, exists)

  validateHighRiskOfViolenceTextArea = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    this.validateSelectorVisibility(SELECTORS.HIGH_RISK_OF_VIOLENCE.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.HIGH_RISK_OF_VIOLENCE.TEXTAREA).should('contain.text', expectedText)
    }
  }

  validateSeriousThreatTextArea = ({ expectedText, isVisible }: { expectedText?: string; isVisible: boolean }) => {
    this.validateSelectorVisibility(SELECTORS.SERIOUS_THREAT.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.SERIOUS_THREAT.TEXTAREA).should('contain.text', expectedText)
    }
  }

  validateExpectedViolenceWarning = (expected: string) =>
    cy
      .get(SELECTORS.VIOLENCE.WARNING)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  validateViolenceInfoExists = ({ exists }: { exists: boolean }) =>
    this.validateSelectorExists(SELECTORS.VIOLENCE.INFO, exists)

  validateExpectedViolenceInfo = (expected: string) =>
    cy
      .get(SELECTORS.VIOLENCE.INFO)
      .invoke('text')
      .then(text => {
        expect(this._cleanString(text)).to.contains(expected)
      })

  setHighRiskOfViolenceText = (text: string) => cy.get(SELECTORS.HIGH_RISK_OF_VIOLENCE.TEXTAREA).type(text)

  setSeriousThreatText = (text: string) => cy.get(SELECTORS.SERIOUS_THREAT.TEXTAREA).type(text)
}
