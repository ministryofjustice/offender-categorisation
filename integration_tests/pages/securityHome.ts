import Page, { PageElement } from './page'

export default class SecurityHomePage extends Page {
  constructor() {
    super('Categorisation referrals')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')
}
