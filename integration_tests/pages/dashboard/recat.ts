import BaseDashboardPage from './base'

type RecategorisationDecisionsTableData = [string, string, string, string][]
type ReviewNumbersTableData = [string, string, string, string, string, string, string][]
type TprsTableData = [string, string][]

export default class DashboardRecategorisationPage extends BaseDashboardPage {
  static baseUrl: string = '/dashboardRecat'

  constructor() {
    super('Recategorisation statistics')
  }

  validateRecategorisationDecisionsTableData = (expectedValues: RecategorisationDecisionsTableData) =>
    cy.checkTableRowData<RecategorisationDecisionsTableData>({
      tableRowsSelector: 'table#recatTable > tbody > tr',
      expectedValues,
    })

  validateReviewNumbersTableData = (expectedValues: ReviewNumbersTableData) =>
    cy.checkTableRowData<ReviewNumbersTableData>({
      tableRowsSelector: 'table#reviewNumbersTable > tbody > tr',
      expectedValues,
    })

  validateTprsTableData = (expectedValues: TprsTableData) =>
    cy.checkTableRowData<TprsTableData>({
      tableRowsSelector: 'table#tprs > tbody > tr',
      expectedValues,
    })
}
