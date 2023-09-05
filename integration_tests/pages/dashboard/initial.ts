import BaseDashboardPage from './base'

type StringArray = [string, ...string[]][]

export default class DashboardInitialPage extends BaseDashboardPage {
  static baseUrl: string = '/dashboardInitial'

  constructor() {
    super('Initial categorisations statistics')
  }

  validateCategorisationDecisionsTableData = (expectedValues: StringArray) =>
    cy.checkTableRowData({
      tableRowsSelector: 'table#initialTable > tbody > tr',
      expectedValues,
    })
}
