import Page, { PageElement } from './page'

export default class CategoryHistoryPage extends Page {
  static baseUrl: string = '/'

  constructor() {
    super('Check previous category reviews')
  }

  headingText = (): PageElement => cy.get('h1')
  rows = (): PageElement => cy.get('table > tbody > tr')
}
