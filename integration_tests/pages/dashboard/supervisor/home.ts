import Page, { PageElement } from '../../page'

export default class SupervisorDashboardHomePage extends Page {
  static baseUrl: string = '/supervisorHome'

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  toDoTabLink = (): PageElement => cy.get('[id=todo-tab]')

  doneTabLink = (): PageElement => cy.get('[id=done-tab]')

  otherCategoriesTabLink = (): PageElement => cy.get('#lite-tab')
}
