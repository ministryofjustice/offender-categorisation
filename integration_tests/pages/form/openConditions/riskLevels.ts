import Page, { PageElement } from '../../page'

const riskLevelsRadioChoiceHtmlSelectors = {
  YES: '#likelyToAbscond',
  NO: '#likelyToAbscond-2',
} as const

type RiskLevelsChoice = keyof typeof riskLevelsRadioChoiceHtmlSelectors
type RiskLevelsChoiceValues =
  | typeof riskLevelsRadioChoiceHtmlSelectors.YES
  | typeof riskLevelsRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  RISK_LEVELS: {
    ERROR: '#likelyToAbscond-error',
  },
}

export default class RiskLevelsPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/riskLevels/${this._bookingId}`
  }

  constructor() {
    super('Risk of escaping or absconding')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new RiskLevelsPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: RiskLevelsChoiceValues
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.RISK_LEVELS.ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateRiskLevelsRadioButton = ({ selection, isChecked }: { selection: RiskLevelsChoice[]; isChecked: boolean }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => riskLevelsRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  selectRiskLevelsRadioButton = (selectedTextValue: RiskLevelsChoice): PageElement =>
    cy.get(riskLevelsRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
