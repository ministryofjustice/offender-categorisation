import BaseRecategoriserPage from './base'

type CategoryReviewsTableData = [string, string, string, string, string, string, string][]

export default class RecategoriserHomePage extends BaseRecategoriserPage {
  static baseUrl: string = '/recategoriserHome'

  constructor() {
    super('Category reviews for prisoners')
  }

  validateCategoryReviewsTableData = (expectedValues: CategoryReviewsTableData) =>
    cy.checkTableRowData<CategoryReviewsTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })
}
