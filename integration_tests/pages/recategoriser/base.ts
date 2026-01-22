import Page, { PageElement } from '../page'
import { LOW_RISK_OF_ESCAPE } from '../../../server/services/filter/homeFilter'

export default abstract class BaseRecategoriserPage extends Page {
  noResultsDiv = (): PageElement => cy.get('#no-results-message')
  noResultsDueToFiltersDiv = (): PageElement => cy.get('#no-results-due-to-filters-message')
  hideFilterButton = (): PageElement => cy.get('#hideFilterButton')
  filterContainer = (): PageElement => cy.get('#filterContainer')
  applyFiltersButton = (): PageElement => cy.get('#applyFilters')
  selectAllFiltersButton = (): PageElement => cy.get('#selectAllSuitabilityForOpenConditionsFilter')
  lowRiskOfEscapeFilterCheckbox = (): PageElement => cy.get(`[data-qa=${LOW_RISK_OF_ESCAPE}_checkbox]`)
  todoTabLink = (): PageElement => cy.get('[id=todo-tab]').contains('Category reviews')
  doneTabLink = (): PageElement => cy.get('[id=done-tab]').contains('Finished reviews')
}
