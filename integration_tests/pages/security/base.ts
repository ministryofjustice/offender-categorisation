import Page, { PageElement } from '../page'

export default abstract class BaseSecurityPage extends Page {
  doneTabLink = (): PageElement => cy.get('[id=done-tab]')
  upcomingTabLink = (): PageElement => cy.get('[id=upcoming-tab]')

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')
}
