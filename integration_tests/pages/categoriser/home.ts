import BaseCategoriserPage from './base'

type ToDoTableData = [string, string, string, string, string, string][] | [string, string, string, string, string][]

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

  // FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  validateToDoTableData = (expectedValues: ToDoTableData) =>
    cy.checkTableRowData<ToDoTableData>({
      tableRowsSelector: 'table.recategorisation-table > tbody > tr',
      expectedValues,
    })
}
