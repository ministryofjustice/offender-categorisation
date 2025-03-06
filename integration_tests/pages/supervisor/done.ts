import BaseSupervisorPage from './base'
import { PageElement } from '../page'

type ToDoTableData = [string, string, string, string, string, string, string][]

export default class SupervisorDonePage extends BaseSupervisorPage {
  static baseUrl: string = '/supervisorDone'

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  viewApprovedPrisonerButton = ({
    bookingId,
    sequenceNumber = 1,
  }: {
    bookingId: number
    sequenceNumber?: number
  }): PageElement => cy.get(`a.govuk-button[href="/form/approvedView/${bookingId}?sequenceNo=${sequenceNumber}"]`)

  validateToDoTableData = (expectedValues: ToDoTableData) =>
    cy.checkTableRowData<ToDoTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })
}
