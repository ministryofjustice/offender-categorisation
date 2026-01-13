import Page, { PageElement } from './page'

export default class CategoryHistoryPage extends Page {
  static baseUrl: string = '/'

  constructor() {
    super('Check previous category reviews')
  }

  headingText = (): PageElement => cy.get('h1')

  rows = (): PageElement => cy.get('table > tbody > tr')

  row = (index: number): PageElement => this.rows().eq(index)

  rowCells = (index: number): PageElement => this.row(index).find('td')

  assertRow = (
    index: number,
    {
      date,
      category,
      location,
      hasViewLink = false,
      hrefContains,
    }: {
      date: string
      category: string
      location: string
      hasViewLink?: boolean
      hrefContains?: string
    },
  ): void => {
    this.rowCells(index).eq(0).should('contain.text', date)
    this.rowCells(index).eq(1).should('contain.text', category)
    this.rowCells(index).eq(2).should('contain.text', location)

    if (hasViewLink) {
      this.rowCells(index).eq(3).find('a').should('have.attr', 'href').and('contain', hrefContains)
    } else {
      this.rowCells(index).eq(3).should('not.have.descendants', 'a')
    }
  }

  clickViewLink = (index: number): void => {
    this.row(index).find('td > a').invoke('removeAttr', 'target').click()
  }
}
