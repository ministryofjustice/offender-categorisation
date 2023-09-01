import { UserAccount } from '../factory/user'

Cypress.Commands.add('checkDefinitionList', ({ term, definition }: { term: string; definition: string }) => {
  cy.get('.govuk-summary-list').contains('dt', term).siblings('dd').should('contain.text', definition)
})

Cypress.Commands.add(
  'checkTableColumnTextValues',
  ({ columnName, expectedValues }: { columnName: string; expectedValues: string[] }) => {
    cy.get('table')
      .contains('th', columnName)
      .invoke('index')
      .then(index => {
        cy.get('tbody tr').each($row => {
          const actualValue = $row.find(`td:eq(${index})`).text().trim()
          const expectedValue = expectedValues.shift()
          expect(actualValue).to.equal(expectedValue)
        })
      })
  }
)

Cypress.Commands.add(
  'checkTableRowData',
  <T>({ tableRowsSelector, expectedValues }: { tableRowsSelector: string; expectedValues: T }) => {
    cy.get(tableRowsSelector).each(($row, $index, $rows) => {
      const rowData = []
      $row.find('td').each(($index, $cell) => {
        rowData.push($cell.textContent.trim())
      })
      expect(rowData).to.deep.equal(expectedValues[$index])
    })
  }
)

Cypress.Commands.add('signIn', (options = { failOnStatusCode: false }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('stubLogin', ({ user }: { user: UserAccount }) => {
  cy.log('stub login for', { user })

  cy.task('stubValidOAuthTokenRequest', { user })
  cy.task('stubUser', { user })
  cy.task('stubUserRoles', { user })
  cy.task('manageDetails')
  cy.task('stubGetMyDetails', { user, caseloadId: user.workingCaseload.id })
  cy.task('stubGetMyCaseloads', { caseloads: user.caseloads })
  cy.task('stubGetPomByOffenderNo')
})
