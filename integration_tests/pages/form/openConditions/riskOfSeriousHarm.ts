import Page, { PageElement } from '../../page'

const riskOfSeriousHarmRadioChoiceHtmlSelectors = {
  YES: '#seriousHarm',
  NO: '#seriousHarm-2',
} as const

type RiskOfSeriousHarmChoice = keyof typeof riskOfSeriousHarmRadioChoiceHtmlSelectors
type RiskOfSeriousHarmChoiceValues =
  | typeof riskOfSeriousHarmRadioChoiceHtmlSelectors.YES
  | typeof riskOfSeriousHarmRadioChoiceHtmlSelectors.NO

const manageInOpenConditionsRadioChoiceHtmlSelectors = {
  YES: '#harmManaged',
  NO: '#harmManaged-2',
} as const

type ManageInOpenConditionsChoice = keyof typeof manageInOpenConditionsRadioChoiceHtmlSelectors
type ManageInOpenConditionsChoiceValues =
  | typeof manageInOpenConditionsRadioChoiceHtmlSelectors.YES
  | typeof manageInOpenConditionsRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  RISK_OF_SERIOUS_HARM: {
    ERROR: '#seriousHarm-error',
  },
  RISK_MANAGED_IN_OPEN_CONDITIONS: {
    TEXTAREA: '#harmManagedText',
  },
} as const

export default class RiskOfSeriousHarmPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/riskOfHarm/${this._bookingId}`
  }

  constructor() {
    super('Risk of serious harm')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new RiskOfSeriousHarmPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | RiskOfSeriousHarmChoiceValues
        | typeof SELECTORS.RISK_MANAGED_IN_OPEN_CONDITIONS.TEXTAREA
        | ManageInOpenConditionsChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector:
        | typeof SELECTORS.RISK_OF_SERIOUS_HARM.ERROR
        | '#likelyToAbscondText-error'
        | '#likelyToAbscond-error'
        | '#harmManaged-error'
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateRiskOfSeriousHarmRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: RiskOfSeriousHarmChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => riskOfSeriousHarmRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectRiskOfSeriousHarmRadioButton = (selectedTextValue: RiskOfSeriousHarmChoice): PageElement =>
    cy.get(riskOfSeriousHarmRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectManageInOpenConditionsRadioButton = (selectedTextValue: ManageInOpenConditionsChoice): PageElement =>
    cy.get(manageInOpenConditionsRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setManageRiskTextInput = (text: string): PageElement =>
    cy.get(SELECTORS.RISK_MANAGED_IN_OPEN_CONDITIONS.TEXTAREA).type(text, { delay: 0 })
}
