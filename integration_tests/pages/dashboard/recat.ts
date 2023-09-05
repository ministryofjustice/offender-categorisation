import BaseDashboardPage from './base'

type StringArray = [string, ...string[]][]
type RecategorisationDecisionsTableData = StringArray
type ReviewNumbersTableData = StringArray
type TprsTableData = StringArray

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
