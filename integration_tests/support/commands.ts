import { UserAccount } from '../factory/user'
import { cleanString } from './utilities'

Cypress.Commands.add('checkDefinitionList', ({ term, definition }: { term: string; definition: string }) => {
  cy.get('.govuk-summary-list')
    .contains('dt', term)
    .siblings('dd')
    .invoke('text')
    .then(text => expect(cleanString(text)).to.contains(definition))
})

Cypress.Commands.add(
  'checkTableColumnTextValues',
  ({
    columnName,
    expectedValues,
    tableIndex = 0,
  }: {
    columnName: string
    expectedValues: string[]
    tableIndex?: number
  }) => {
    cy.get('table')
      .eq(tableIndex)
      .within(() => {
        cy.contains('th', columnName)
          .invoke('index')
          .then(index => {
            cy.get('tbody tr').each($row => {
              const actualValue = $row.find(`td:eq(${index})`).text().trim()
              const expectedValue = expectedValues.shift()
              expect(actualValue).to.equal(expectedValue)
            })
          })
      })
  },
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
  },
)

Cypress.Commands.add('validateCategorisationDetails', (columns: { key: string; value: string }[][]) => {
  columns.forEach((column, index) => {
    column.forEach(({ key, value }) => {
      cy.get('.govuk-grid-column-one-third').eq(index).should('contain.text', key).should('contain.text', value)
    })
  })
})

Cypress.Commands.add('signIn', (options = { failOnStatusCode: false }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('stubLogin', ({ user }: { user: UserAccount }) => {
  cy.log('stub login for', { user })

  cy.clearCookies()

  cy.task('stubValidOAuthTokenRequest', { user })
  cy.task('stubUser', { user })
  cy.task('stubUserRoles', { user })
  cy.task('stubDpsComponentsSuccess')
  cy.task('manageDetails')
  cy.task('stubGetMyDetails', { user, caseloadId: user.workingCaseload.id })
  cy.task('stubGetMyCaseloads', { caseloads: user.caseloads })
  cy.task('stubGetPomByOffenderNo')
})

Cypress.Commands.add(
  'assertDBWithRetries',
  (task: string, arg: any, assertionFn: (result: any) => boolean, retries: number = 10, delay: number = 500) => {
    const assertDBWithRetries = (remainingRetries: number): Cypress.Chainable => {
      if (remainingRetries <= 0) {
        throw new Error(`Database assertion remained false after the specified retries`)
      }

      return cy.task(task, arg).then((result: any) => {
        if (result && assertionFn(result)) {
          return Cypress.Promise.resolve(true)
        }
        return cy.wait(delay).then(() => {
          assertDBWithRetries(remainingRetries - 1)
        })
      })
    }

    return assertDBWithRetries(retries)
  },
)
