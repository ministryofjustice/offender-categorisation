import Page, { PageElement } from '../page'
import { OVERDUE } from '../../../server/services/filter/homeFilter'

export default abstract class BaseCategoriserPage extends Page {
  doneTabLink = (): PageElement => cy.get('[id=done-tab]')

  noResultsDiv = (): PageElement => cy.get('#no-results-message')
  noResultsDueToFiltersDiv = (): PageElement => cy.get('#no-results-due-to-filters-message')

  hideFilterButton = (): PageElement => cy.get('#hideFilterButton')
  filterContainer = (): PageElement => cy.get('#filterContainer')
  applyFiltersButton = (): PageElement => cy.get('#applyFilters')
  overdueCheckbox = (): PageElement => cy.get(`[data-qa=${OVERDUE}_checkbox]`)

  multipleRoleDiv = (): PageElement => cy.get('#multiple-role')
  roleSwitchSelect = (): PageElement => cy.get('#roleSwitch')
  switchRole = (role: string): PageElement => this.roleSwitchSelect().select(role)
}
