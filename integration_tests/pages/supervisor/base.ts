import Page, { PageElement } from '../page'

export default abstract class BaseSupervisorPage extends Page {
  noResultsDiv = (): PageElement => cy.get('#no-results-message')

  doneTabLink = (): PageElement => cy.get('[id=done-tab]')
  toDoTabLink = (): PageElement => cy.get('[id=todo-tab]')
  otherCategoriesLink = (): PageElement => cy.get('[id=lite-tab]')

  multipleRoleDiv = (): PageElement => cy.get('#multiple-role')
  roleSwitchSelect = (): PageElement => cy.get('#roleSwitch')
  switchRole = (role: string): PageElement => this.roleSwitchSelect().select(role)
}
