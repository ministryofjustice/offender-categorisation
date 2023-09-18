import Page, { PageElement } from '../../page'

type OtherCategoriesTableData = [string, string, string, string, string, string][]

export default class SupervisorDashboardHomePage extends Page {
  static baseUrl: string = '/supervisorHome'

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  toDoTabLink = (): PageElement => cy.get('[id=todo-tab]')

  doneTabLink = (): PageElement => cy.get('[id=done-tab]')

  otherCategoriesTabLink = (): PageElement => cy.get('#lite-tab')

  validateOtherCategoriesTableData = (expectedValues: OtherCategoriesTableData) =>
    cy.checkTableRowData<OtherCategoriesTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })

  approveOtherCategoriesApprovalButton = ({ bookingId }: { bookingId: number }): PageElement =>
    cy.get(`a.govuk-button[href="/liteCategories/approve/${bookingId}"]`)
}
