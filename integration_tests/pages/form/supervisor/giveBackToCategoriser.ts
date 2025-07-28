import Page, { PageElement } from "../../page";

const giveBackToCategoriserRadioChoiceHtmlSelectors = {
  YES: '#giveBackToCategoriser',
  NO: '#giveBackToCategoriser-2',
} as const

type GiveBackToCategoriserChoice = keyof typeof giveBackToCategoriserRadioChoiceHtmlSelectors

export default class GiveBackToCategoriserPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/supervisor/further-information/${this._bookingId}`
  }

  constructor(changeCategoryToText: string) {
    super(changeCategoryToText)
  }

  static createForBookingId = (bookingId: number, changeCategoryToText: string) => {
    this._bookingId = bookingId
    return new GiveBackToCategoriserPage(changeCategoryToText)
  }

  selectGiveBackToCategoriserRadioButton = (selectedTextValue: GiveBackToCategoriserChoice): PageElement =>
    cy.get(giveBackToCategoriserRadioChoiceHtmlSelectors[selectedTextValue]).click()

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Continue')
}
