import Page, { PageElement } from '../page'

export default abstract class BaseRecategoriserPage extends Page {
  noResultsDiv = (): PageElement => cy.get('#no-results-message')
  hideFilterButton = (): PageElement => cy.get('#hideFilterButton')
  filterContainer = (): PageElement => cy.get('#filterContainer')
  applyFiltersButton = (): PageElement => cy.get('#applyFilters')
  selectAllFiltersButton = (): PageElement => cy.get('#selectAllSuitabilityForOpenConditionsFilter')
  lowRiskOfEscapeFilterCheckbox = (): PageElement => cy.get('[data-qa=lowRiskOfEscape_checkbox]')
}
