import Page, { PageElement } from '../page'

export default abstract class BaseCategoriserPage extends Page {
  doneTabLink = (): PageElement => cy.get('[id=done-tab]')

  noResultsDiv = (): PageElement => cy.get('#no-results-message')
}
