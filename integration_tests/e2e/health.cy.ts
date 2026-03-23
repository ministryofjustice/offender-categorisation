context('Healthcheck', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubAllocationManagerHealth')
    cy.task('stubAuthPing')
    cy.task('stubElite2Ping')
    cy.task('stubPrisonerSearchPing')
    cy.task('stubPathfinderPing')
    cy.task('stubAlertsApiPing')
    cy.task('stubAdjudicationsApiPing')
  })

  context('All healthy', () => {
    it('Health check page is visible', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body').should('equal', 'pong')
    })
  })
})
