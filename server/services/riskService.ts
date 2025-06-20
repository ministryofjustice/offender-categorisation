import logger = require('../../log')

function createRiskService(alertsApiClientBuilder) {
  return {
    async getActiveEscapeRisk(offenderNo, context) {
      try {
        const alertsApiClient = alertsApiClientBuilder(context)
        const response = await alertsApiClient.getPrisonersActiveEscapeAlerts(offenderNo)
        return response.content
      } catch (error) {
        logger.error(error)
        throw error
      }
    },
  }
}

module.exports = createRiskService
