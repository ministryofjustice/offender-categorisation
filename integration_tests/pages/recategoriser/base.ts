import Page, { PageElement } from '../page'

export default abstract class BaseRecategoriserPage extends Page {
  noResultsDiv = (): PageElement => cy.get('#no-results-message')
}
