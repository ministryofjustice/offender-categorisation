import Page, { PageElement } from '../page'

export default class CancelPage extends Page {
  static baseUrl: string = '/form/cancel'

  constructor() {
    super('Confirm cancellation')
  }

  confirmYes = (): PageElement => cy.get('#confirm')
  confirmNo = (): PageElement => cy.get('#confirm-2')

  submitButton = (): PageElement => cy.get('button.govuk-button')
}
