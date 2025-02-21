import BaseCategoriserPage from './base'

// FIXME
type ToDoTableData = (string[])[]

export default class CategoriserHomePage extends BaseCategoriserPage {
  static baseUrl: string = '/categoriserHome'

  constructor() {
    super('Prisoner Categorisation')
  }

  selectPrisonerWithBookingId(bookingId: number, expectedButtonText = 'Start') {
    cy.contains(`a[href="/tasklist/${bookingId}"]`, expectedButtonText).click()
  }
  selectCompletedPrisonerWithBookingId(bookingId: number) {
    cy.contains(`a[href="/form/awaitingApprovalView/${bookingId}"]`, 'View').click()
  }

  validateToDoTableData = (expectedValues: ToDoTableData) =>
    cy.checkTableRowData<ToDoTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })
}
