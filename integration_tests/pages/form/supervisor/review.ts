import Page, { PageElement } from '../../page'

const agreeWithProvisionalCategoryRadioChoiceHtmlSelectors = {
  YES: '#supervisorCategoryAppropriate',
  NO: '#supervisorCategoryAppropriate-2',
} as const

export type AgreeWithProvisionalCategoryChoice = keyof typeof agreeWithProvisionalCategoryRadioChoiceHtmlSelectors
type AgreeWithProvisionalCategoryChoiceValues =
  | typeof agreeWithProvisionalCategoryRadioChoiceHtmlSelectors.YES
  | typeof agreeWithProvisionalCategoryRadioChoiceHtmlSelectors.NO

const whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors = {
  YOI_OPEN: '#overriddenCategoryJ',
  CONSIDER_FOR_CLOSED: '#overriddenCategoryR',
} as const

export type WhichCategoryIsMoreAppropriateChoice = keyof typeof whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors
type WhichCategoryIsMoreAppropriateChoiceValues =
  | typeof whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors.YOI_OPEN
  | typeof whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors.CONSIDER_FOR_CLOSED

const SELECTORS = {
  INDETERMINATE_WARNING: '#indeterminateWarning',
  OPEN_CONDITIONS: {
    INFO_MESSAGE: '#openConditionsInfoMessage',
  },
  OTHER_INFORMATION: {
    ERROR: '#otherInformationText-error',
    TEXT_ERROR: '#otherInformationText-error',
    TEXTAREA: '#otherInformationText',
  },
  OVERRIDE_CATEGORY_J: {
    ERROR: '#supervisorOverriddenCategoryText-error',
    TEXT_ERROR: '#supervisorOverriddenCategoryText-error',
    TEXTAREA: '#supervisorOverriddenCategoryText',
  },
}

export default class SupervisorReviewPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/supervisor/review/${this._bookingId}`
  }

  constructor() {
    super('Approve category')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new SupervisorReviewPage()
  }

  giveBackToCategoriserButton = (bookingId: number): PageElement =>
    cy.get(`a[href="/form/supervisor/confirmBack/${bookingId}"]`).contains('Give back to categoriser')

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Submit')

  selectAgreeWithProvisionalCategoryRadioButton = (
    selectedTextValue: AgreeWithProvisionalCategoryChoice
  ): PageElement => cy.get(agreeWithProvisionalCategoryRadioChoiceHtmlSelectors[selectedTextValue]).click()

  setAgreeWithProvisionalCategoryText = (text: string) => cy.get(SELECTORS.OTHER_INFORMATION.TEXTAREA).type(text)

  selectWhichCategoryIsMoreAppropriateRadioButton = (
    selectedTextValue: WhichCategoryIsMoreAppropriateChoice
  ): PageElement => cy.get(whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors[selectedTextValue]).click()

  validateWhichCategoryIsMoreAppropriateRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: WhichCategoryIsMoreAppropriateChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => whichCategoryIsMoreAppropriateRadioChoiceHtmlSelectors[selectedTextValue]),
      isChecked
    )

  setWhichCategoryIsMoreAppropriateText = (text: string) => cy.get(SELECTORS.OVERRIDE_CATEGORY_J.TEXTAREA).type(text)

  validateOtherRelevantInformationTextBox = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(SELECTORS.OTHER_INFORMATION.TEXTAREA, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.OTHER_INFORMATION.TEXTAREA).should('contain.text', expectedText)
    }
  }

  validateIndeterminateWarningIsDisplayed = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(SELECTORS.INDETERMINATE_WARNING, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.INDETERMINATE_WARNING).should('contain.text', expectedText)
    }
  }

  validateOpenConditionsInfoMessageIsDisplayed = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(SELECTORS.OPEN_CONDITIONS.INFO_MESSAGE, isVisible)

    if (isVisible) {
      cy.get(SELECTORS.OPEN_CONDITIONS.INFO_MESSAGE).should('contain.text', expectedText)
    }
  }
  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | AgreeWithProvisionalCategoryChoiceValues
        | WhichCategoryIsMoreAppropriateChoiceValues
        | typeof SELECTORS.OTHER_INFORMATION.TEXTAREA
        | typeof SELECTORS.OVERRIDE_CATEGORY_J.TEXTAREA
      text: string
    }[]
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector: typeof SELECTORS.OTHER_INFORMATION.ERROR | typeof SELECTORS.OVERRIDE_CATEGORY_J.TEXT_ERROR
      text: string
    }[]
  ) {
    super.validateErrorMessages(errorMessages)
  }
}
