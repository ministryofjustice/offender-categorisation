Cypress.Commands.add('signIn', (options = { failOnStatusCode: false }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
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
