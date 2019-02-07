const logger = require('../../log.js')

module.exports = function createRiskProfilerService(riskProfilerClientBuilder) {
  return {
    async getSecurityProfile(offenderNo, userId) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(userId)
        return await riskProfilerClient.getSocProfile(offenderNo)
      } catch (error) {
        logger.error(error, 'Error during getSecurityProfile')
        throw error
      }
    },

    async getViolenceProfile(offenderNo, userId) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(userId)
        return await riskProfilerClient.getViolenceProfile(offenderNo)
      } catch (error) {
        logger.error(error, 'Error during getViolenceProfile')
        throw error
      }
    },

    async getEscapeProfile(offenderNo, userId) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(userId)
        return await riskProfilerClient.getEscapeProfile(offenderNo)
      } catch (error) {
        logger.error(error, 'Error during getEscapeProfile')
        throw error
      }
    },

    async getExtremismProfile(offenderNo, userId, previousOffences) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(userId)
        return await riskProfilerClient.getExtremismProfile(offenderNo, previousOffences)
      } catch (error) {
        logger.error(error, 'Error during getExtremismProfile')
        throw error
      }
    },
  }
}
