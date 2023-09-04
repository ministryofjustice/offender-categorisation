import Page, { PageElement } from '../page'

export default abstract class BaseCategorisationPage extends Page {
  doneTabLink = (): PageElement => cy.get('[id=done-tab]')
  toDoTabLink = (): PageElement => cy.get('[id=todo-tab]')

  noResultsDiv = (): PageElement => cy.get('#no-results-message')
}
