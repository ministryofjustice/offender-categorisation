declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Custom command to check a HTML table for a given header, and all text values in that column.
     * @example cy.checkTableColumnTextValues({ columnName: 'Name', expectedValues: ['Dent, Jane', 'Clark, Frank'] })
     */
    checkTableColumnTextValues({ columnName: string, expectedValues: string[] }): Chainable<AUTWindow>
  }
}
