import BaseSupervisorPage from './base'

type ToDoTableData = [string, string, string, string, string, string, string, string][]

export default class SupervisorHomePage extends BaseSupervisorPage {
  static baseUrl: string = '/supervisorHome'

  constructor() {
    super('Prisoner Categorisation Approvals')
  }

  startReviewForPrisoner = (bookingId: number) =>
    cy.get(`a[href="/form/supervisor/review/${bookingId}"`).should('contain.text', 'Start').click()

  validateToDoTableData = (expectedValues: ToDoTableData) =>
    cy.checkTableRowData<ToDoTableData>({
      tableRowsSelector: 'table#offenderTable > tbody > tr',
      expectedValues,
    })

  smartSurveyLink = () => cy.get('#smartSurveyLink')
}
