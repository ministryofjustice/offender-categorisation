import logger = require('../../log')

import transformDataToEscapeProfile = require('../utils/riskServiceHelpers')

function createRiskService(alertsApiClientBuilder) {
  return {
    async getEscapeProfile(offenderNo, context) {
      try {
        const alertsApiClient = alertsApiClientBuilder(context)
        const response = await alertsApiClient.getPrisonersActiveEscapeAlerts(offenderNo)
        const escapeProfile = transformDataToEscapeProfile(response.content)
        return escapeProfile
      } catch (error) {
        logger.error(error)
        throw error
      }
    },
  }
}

module.exports = createRiskService
