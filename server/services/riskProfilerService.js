const logger = require('../../log.js')

module.exports = function createRiskProfilerService(riskProfilerClientBuilder) {
  async function getSecurityProfile(offenderNo, userId) {
    try {
      const riskProfilerClient = riskProfilerClientBuilder(userId)
      return await riskProfilerClient.getSocProfile(offenderNo)
    } catch (error) {
      logger.error(error, 'Error during getSecurityProfile')
      throw error
    }
  }

  async function getEscapeProfile(offenderNo, userId) {
    try {
      const riskProfilerClient = riskProfilerClientBuilder(userId)
      return await riskProfilerClient.getSocProfile(offenderNo)
    } catch (error) {
      logger.error(error, 'Error during getSecurityProfile')
      throw error
    }
  }

  return {
    getSecurityProfile,
    getEscapeProfile,
  }
}
