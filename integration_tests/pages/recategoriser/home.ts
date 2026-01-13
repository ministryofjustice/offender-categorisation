import BaseRecategoriserPage from './base'

type CategoryReviewsTableData = [string, string, string, string, string, string][]

export default class RecategoriserHomePage extends BaseRecategoriserPage {
  static baseUrl: string = '/recategoriserHome'

  constructor() {
    super('Category reviews for prisoners')
  }

  validateCategoryReviewsTableData = (expectedValues: CategoryReviewsTableData) =>
    cy.checkTableRowData<CategoryReviewsTableData>({
      tableRowsSelector: 'table.recategorisation-table > tbody > tr',
      expectedValues,
    })

  selectPrisonerWithBookingId(bookingId: number, expectedButtonText = 'Start', reason = 'DUE') {
    cy.contains(`a[href="/tasklistRecat/${bookingId}?reason=${reason}"]`, expectedButtonText).click()
  }

  selectPrisonerAwaitingApprovalWithBookingId(bookingId: number, expectedButtonText = 'View') {
    cy.contains(`a[href="/form/awaitingApprovalView/${bookingId}"]`, expectedButtonText).click()
  }

  continueReviewForPrisoner = (bookingId: number, reviewReason: 'DUE') =>
    cy.get(`a[href="/tasklistRecat/${bookingId}?reason=${reviewReason}"`).should('contain.text', 'Edit').click()

  viewReviewAwaitingApprovalForPrisoner = (bookingId: number) =>
    cy.get(`a[href="/form/awaitingApprovalView/${bookingId}"`).should('contain.text', 'View').click()

  potentialReviewsTab = () =>
    cy.get(`a[href="/recategoriserCheck"`).should('contain.text', 'Potential reviews')
}
