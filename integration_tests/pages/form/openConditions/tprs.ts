import Page, { PageElement } from '../../page'

const tprsRadioChoiceHtmlSelectors = {
  YES: '#tprsSelected',
  NO: '#tprsSelected-2',
} as const

type TprsChoice = keyof typeof tprsRadioChoiceHtmlSelectors
type TprsChoiceValues = typeof tprsRadioChoiceHtmlSelectors.YES | typeof tprsRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  TPRS: {
    ERROR: '#tprsSelected-error',
  },
}

export default class TprsPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/tprs/${this._bookingId}`
  }

  constructor() {
    super('Is this prisoner eligible for the Temporary Presumptive Recategorisation Scheme (TPRS)?')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new TprsPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: TprsChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.TPRS.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateTprsRadioButton = ({ selection, isChecked }: { selection: TprsChoice[]; isChecked: boolean }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => tprsRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectTprsRadioButton = (selectedTextValue: TprsChoice): PageElement =>
    cy.get(tprsRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
