import logger = require('../../log')

function createRiskService(alertsApiClientBuilder) {
  return {
    async getActiveEscapeRisk(offenderNo, context) {
      try {
        const alertsApiClient = alertsApiClientBuilder(context)
        const response = await alertsApiClient.getPrisonersActiveEscapeAlerts(offenderNo)
        console.log(response, '<-- response in alertsApi')
      } catch (error) {
        logger.error(error)
        throw error
      }
    },
  }
}

module.exports = createRiskService
