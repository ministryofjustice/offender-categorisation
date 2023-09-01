import Page, { PageElement } from '../page'

type AverageDurationsTableRowData = [string, string][]
type SecurityTableRowData = [string, string][]
type CompletionsTableRowData = [string, string, string][]

export default abstract class BaseDashboardPage extends Page {
  dateFromInput = (): PageElement => cy.get('#startDate')
  dateToInput = (): PageElement => cy.get('#endDate')
  prisonStatisticsSelectionBox = (): PageElement => cy.get('#scope')
  submitSearchButton = (): PageElement => cy.get('button[type="submit"]').contains('Update')

  validateReferralsToSecurityTableData = (expectedValues: SecurityTableRowData) =>
    cy.checkTableRowData<SecurityTableRowData>({
      tableRowsSelector: 'table#security > tbody > tr',
      expectedValues,
    })

  validateAverageDurationsTableData = (expectedValues: AverageDurationsTableRowData) =>
    cy.checkTableRowData<AverageDurationsTableRowData>({
      tableRowsSelector: 'table#timeline > tbody > tr',
      expectedValues,
    })

  validateCompletionsTableData = (expectedValues: CompletionsTableRowData) =>
    cy.checkTableRowData<CompletionsTableRowData>({
      tableRowsSelector: 'table#completion > tbody > tr',
      expectedValues,
    })
}
