import Page, { PageElement } from '../page'

export default class CancelConfirmedPage extends Page {
  static baseUrl: string = '/form/cancelConfirmed'

  constructor() {
    super('Categorisation has been removed')
  }

  finishButton = (): PageElement => cy.get('#finishButton')
  manageLink = (): PageElement => cy.get('#manageLink')
}
