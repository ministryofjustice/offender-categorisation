import BaseDashboardPage from './base'

type CategorisationDecisionsTableData = [string, string, string, string, string][]

export default class DashboardInitialPage extends BaseDashboardPage {
  static baseUrl: string = '/dashboardInitial'

  constructor() {
    super('Initial categorisations statistics')
  }

  validateCategorisationDecisionsTableData = (expectedValues: CategorisationDecisionsTableData) =>
    cy.checkTableRowData<CategorisationDecisionsTableData>({
      tableRowsSelector: 'table#initialTable > tbody > tr',
      expectedValues,
    })
}
