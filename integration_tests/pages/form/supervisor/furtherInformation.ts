import Page, { PageElement } from "../../page";

export default class FurtherInformationPage extends Page {
  private static _bookingId: number

  static get baseUrl(): string {
    return `/form/supervisor/further-information/${this._bookingId}`
  }

  constructor() {
    super('Further information')
  }

  static createForBookingId = (bookingId: number) => {
    this._bookingId = bookingId
    return new FurtherInformationPage()
  }

  enterFurtherInformation(furtherInformation: string): PageElement {
    return cy.get('#otherInformationText').type(furtherInformation)
  }

  submitButton = (): PageElement => cy.get('button[type="submit"]').contains('Save and submit')
}
