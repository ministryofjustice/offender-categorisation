import BaseRecategoriserPage from './base'

type CategoryReviewsTableData = [string, string, string, string, string, string, string][]

export default class RecategoriserDonePage extends BaseRecategoriserPage {
  static baseUrl: string = '/recategoriserDone'

  constructor() {
    super('Category reviews for prisoners')
  }
  /*
  validateCategoryReviewsTableData = (expectedValues: CategoryReviewsTableData) =>
    cy.checkTableRowData<CategoryReviewsTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })

  continueReviewForPrisoner = (bookingId: number, reviewReason: 'DUE') =>
    cy.get(`a[href="/tasklistRecat/${bookingId}?reason=${reviewReason}"`).should('contain.text', 'Edit').click()

  viewReviewAwaitingApprovalForPrisoner = (bookingId: number) =>
    cy.get(`a[href="/form/awaitingApprovalView/${bookingId}"`).should('contain.text', 'View').click()*/
}
