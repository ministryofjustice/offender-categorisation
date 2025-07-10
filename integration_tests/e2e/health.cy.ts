context('Healthcheck', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubAllocationManagerHealth')
    cy.task('stubAuthPing')
    cy.task('stubElite2Ping')
    cy.task('stubPrisonerSearchPing')
    cy.task('stubRiskProfilerPing')
    cy.task('stubAlertsApiPing')
  })

  context('All healthy', () => {
    it('Health check page is visible', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body').should('equal', 'pong')
    })
  })

  context('Some unhealthy', () => {
    it('Reports correctly when risk profiler is down', () => {
      cy.task('stubRiskProfilerPing', 500)

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.status).to.equal('DOWN')
        expect(response.body.api.allocation).to.equal('UP')
        expect(response.body.api.auth).to.equal('UP')
        expect(response.body.api.elite2).to.equal('UP')
        expect(response.body.api.prisonerSearch).to.equal('UP')
        expect(response.body.api.riskProfiler).to.contain({ status: 500, retries: 2 })
      })
    })
  })
})
