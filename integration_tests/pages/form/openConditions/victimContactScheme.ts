import Page, { PageElement } from '../../page'

const victimContactSchemeRadioChoiceHtmlSelectors = {
  YES: '#vcsOptedFor',
  NO: '#vcsOptedFor-2',
} as const

type VictimContactSchemeChoice = keyof typeof victimContactSchemeRadioChoiceHtmlSelectors
type VictimContactSchemeChoiceValues =
  | typeof victimContactSchemeRadioChoiceHtmlSelectors.YES
  | typeof victimContactSchemeRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  VICTIM_CONTACT_SCHEME: {
    ERROR: '#vcsOptedFor-error',
  },
}

export default class VictimContactSchemePage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/victimContactScheme/${this._bookingId}`
  }

  constructor() {
    super('Victim Contact Scheme (VCS)')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new VictimContactSchemePage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: VictimContactSchemeChoiceValues
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.VICTIM_CONTACT_SCHEME.ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateVictimContactSchemeRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: VictimContactSchemeChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => victimContactSchemeRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  selectVictimContactSchemeRadioButton = (selectedTextValue: VictimContactSchemeChoice): PageElement =>
    cy.get(victimContactSchemeRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
