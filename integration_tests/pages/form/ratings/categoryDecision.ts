import Page, { PageElement } from '../../page'

const categoryDecisionRadioChoiceHtmlSelectors = {
  CLOSED: '#closedOption',
  OPEN: '#openOption',
} as const

const yoiCategoryDecisionRadioChoiceHtmlSelectors = {
  YOI_CLOSED: '#catIOption',
  CONSIDER_FOR_OPEN: '#catJOption',
  CLOSED: '#closedOption',
} as const

type CategoryDecisionChoice = keyof typeof categoryDecisionRadioChoiceHtmlSelectors
type YOICategoryDecisionChoice = keyof typeof yoiCategoryDecisionRadioChoiceHtmlSelectors

export default class CategoryDecisionPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/ratings/decision/${this._bookingId}`
  }

  constructor() {
    super('Category decision')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new CategoryDecisionPage()
  }

  continueButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and return')

  selectCategoryDecisionRadioButton = (selectedTextValue: CategoryDecisionChoice): PageElement =>
    cy.get(categoryDecisionRadioChoiceHtmlSelectors[selectedTextValue]).click()

  enterCategoryDecisionJustification = (text: string): PageElement => cy.get('#justification').type(text)

  selectYOICategoryDecisionRadioButton = (selectedTextValue: YOICategoryDecisionChoice): PageElement =>
    cy.get(yoiCategoryDecisionRadioChoiceHtmlSelectors[selectedTextValue]).click()
}
