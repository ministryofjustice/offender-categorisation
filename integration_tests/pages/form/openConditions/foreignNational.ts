import Page, { PageElement } from '../../page'

const foreignNationalRadioChoiceHtmlSelectors = {
  YES: '#isForeignNational',
  NO: '#isForeignNational-2',
} as const

type ForeignNationalChoice = keyof typeof foreignNationalRadioChoiceHtmlSelectors
type ForeignNationalChoiceValues =
  | typeof foreignNationalRadioChoiceHtmlSelectors.YES
  | typeof foreignNationalRadioChoiceHtmlSelectors.NO

const homeOfficeImmigrationStatusRadioChoiceHtmlSelectors = {
  YES: '#formCompleted',
  NO: '#formCompleted-2',
} as const

type HomeOfficeImmigrationStatusChoice = keyof typeof homeOfficeImmigrationStatusRadioChoiceHtmlSelectors
type HomeOfficeImmigrationStatusChoiceValues =
  | typeof homeOfficeImmigrationStatusRadioChoiceHtmlSelectors.YES
  | typeof homeOfficeImmigrationStatusRadioChoiceHtmlSelectors.NO

const liabilityToBeDeportedRadioChoiceHtmlSelectors = {
  YES: '#dueDeported',
  NO: '#dueDeported-2',
} as const

type LiabilityToBeDeportedChoice = keyof typeof liabilityToBeDeportedRadioChoiceHtmlSelectors
type LiabilityToBeDeportedChoiceValues =
  | typeof liabilityToBeDeportedRadioChoiceHtmlSelectors.YES
  | typeof liabilityToBeDeportedRadioChoiceHtmlSelectors.NO

const exhaustedAppealRadioChoiceHtmlSelectors = {
  YES: '#exhaustedAppeal',
  NO: '#exhaustedAppeal-2',
} as const

type ExhaustedAppealChoice = keyof typeof exhaustedAppealRadioChoiceHtmlSelectors
type ExhaustedAppealChoiceValues =
  | typeof exhaustedAppealRadioChoiceHtmlSelectors.YES
  | typeof exhaustedAppealRadioChoiceHtmlSelectors.NO

const SELECTORS = {
  FOREIGN_NATIONAL: {
    ERROR: '#isForeignNational-error',
  },
  HOME_OFFICE_IMMIGRATION_STATUS: {},
}

export default class ForeignNationalPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/openConditions/foreignNational/${this._bookingId}`
  }

  constructor() {
    super('Foreign national')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new ForeignNationalPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href: ForeignNationalChoiceValues | HomeOfficeImmigrationStatusChoiceValues | ExhaustedAppealChoiceValues
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.FOREIGN_NATIONAL.ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  validateForeignNationalRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: ForeignNationalChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => foreignNationalRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked,
    )

  selectForeignNationalRadioButton = (selectedTextValue: ForeignNationalChoice): PageElement =>
    cy.get(foreignNationalRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectHomeOfficeImmigrationStatusRadioButton = (selectedTextValue: HomeOfficeImmigrationStatusChoice): PageElement =>
    cy.get(homeOfficeImmigrationStatusRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectLiabilityToBeDeportedRadioButton = (selectedTextValue: LiabilityToBeDeportedChoice): PageElement =>
    cy.get(liabilityToBeDeportedRadioChoiceHtmlSelectors[selectedTextValue]).click()

  selectExhaustedAppealRadioButton = (selectedTextValue: ExhaustedAppealChoice): PageElement =>
    cy.get(exhaustedAppealRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
