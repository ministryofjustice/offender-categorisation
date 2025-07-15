import Page, { PageElement } from '../../page'

export const selectors = {
  SUPERVISOR_DECISION: '#supervisorDecision',
  CONFIRM_BACK: '#messageText',
  SUPERVISOR_DECISION_ERROR: '#supervisorDecision-error',
  CONFIRM_BACK_ERROR: '#messageText-error',
  INDETERMINATE_WARNING: '#indeterminateWarning'
}

export const supervisorDecisionRadioButtonChoices = {
  AGREE_WITH_CATEGORY_DECISION: '#agreeWithCategoryDecision',
  CHANGE_TO_CATEGORY_T: '#changeCategoryTo_T',
  CHANGE_TO_CATEGORY_D: '#changeCategoryTo_D',
  CHANGE_TO_CATEGORY_C: '#changeCategoryTo_C',
  CHANGE_TO_CATEGORY_B: '#changeCategoryTo_B',
  CHANGE_TO_CATEGORY_J: '#changeCategoryTo_J',
  CHANGE_TO_CATEGORY_I: '#changeCategoryTo_I',
  CHANGE_TO_CATEGORY_R: '#changeCategoryTo_R',
  GIVE_BACK_TO_CATEGORISER: '#requestMoreInformation',
} as const

type SupervisorDecisionRadioButtonChoice = keyof typeof supervisorDecisionRadioButtonChoices

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

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')

  validateWhichCategoryIsMoreAppropriateRadioButton = ({
    selection,
    isChecked,
  }: {
    selection: SupervisorDecisionRadioButtonChoice[]
    isChecked: boolean
  }) =>
    this.validateRadioButtonSelections(
      selection.map(selectedTextValue => supervisorDecisionRadioButtonChoices[selectedTextValue]),
      isChecked,
    )

  validateIndeterminateWarningIsDisplayed = ({
    expectedText,
    isVisible,
  }: {
    expectedText?: string
    isVisible: boolean
  }) => {
    this.validateSelectorVisibility(selectors.INDETERMINATE_WARNING, isVisible)

    if (isVisible) {
      cy.get(selectors.INDETERMINATE_WARNING).should('contain.text', expectedText)
    }
  }

  validateErrorSummaryMessages(
    errorSummaryMessages: {
      index: number
      href:
        | typeof selectors.SUPERVISOR_DECISION
        | typeof selectors.CONFIRM_BACK
      text: string
    }[],
  ) {
    super.validateErrorSummaryMessages(errorSummaryMessages)
  }

  validateErrorMessages(
    errorMessages: {
      selector:
        | typeof selectors.SUPERVISOR_DECISION_ERROR
        | typeof selectors.CONFIRM_BACK_ERROR
      text: string
    }[],
  ) {
    super.validateErrorMessages(errorMessages)
  }

  supervisorDecisionRadioButton(supervisorDecisionRadioButtonChoice: SupervisorDecisionRadioButtonChoice) {
    return cy.get(supervisorDecisionRadioButtonChoices[supervisorDecisionRadioButtonChoice])
  }
}
