import Page, { PageElement } from '../page'

export default class SupervisorLiteListPage extends Page {
  static get baseUrl(): string {
    return `/liteCategories/approveList`
  }

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  approveOtherCategoriesApprovalButton = ({ bookingId }: { bookingId: number }): PageElement =>
    cy.get(`a.govuk-button[href="/liteCategories/approve/${bookingId}"]`)
}
