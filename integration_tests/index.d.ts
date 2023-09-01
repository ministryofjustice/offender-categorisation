declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to check a HTML definition list for a given term (dt), and the text value for that definition (dl).
     * @example cy.checkDefinitionList({ term: 'Categoriser comments', definition: 'Comments from Categoriser' })
     */
    checkDefinitionList({ term: string, definition: string }): Chainable<AUTWindow>

    /**
     * Custom command to check a HTML table for a given header, and all text values in that column.
     * @example cy.checkTableColumnTextValues({ columnName: 'Name', expectedValues: ['Dent, Jane', 'Clark, Frank'] })
     */
    checkTableColumnTextValues({ columnName: string, expectedValues: string[] }): Chainable<AUTWindow>

    /**
     * Custom command to check all rows in a HTML table match the provided array of values
     * @example cy.checkTableRowData({ tableRowsSelector: '#initialTable > tbody > tr', expectedValues: [['a','b','c'], ['a','x','y]] })
     */
    checkTableRowData<T>({ tableRowsSelector: string; expectedValues: T }): Chainable<AUTWindow>

    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Custom command to stub the login API response details to enable login as a specific user.
     * @example cy.stubLogin({ user: SUPERVISOR_USER })
     */
    stubLogin({ user: UserAccount }): Chainable<AUTWindow>
  }
}
