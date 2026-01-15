import { PageElement } from '../page'
import BaseRecategoriserPage from './base'

type PotentialReviewsTableData = [string, string, string, string][]

export default class PotentialReviewsPage extends BaseRecategoriserPage {
  static baseUrl: string = '/recategoriserCheck'

  constructor() {
    super('Category reviews for prisoners')
  }

  validateCategoryReviewsTableData = (expectedValues: PotentialReviewsTableData) =>
    cy.checkTableRowData<PotentialReviewsTableData>({
      tableRowsSelector: 'table.potential-reviews-table > tbody > tr',
      expectedValues,
    })

  checkNowButton = (): PageElement => cy.get('#checkNowButton')
}
