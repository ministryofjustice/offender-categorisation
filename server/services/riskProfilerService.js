const logger = require('../../log')

module.exports = function createRiskProfilerService(riskProfilerClientBuilder) {
  return {
    async getViolenceProfile(offenderNo, context) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(context)
        return await riskProfilerClient.getViolenceProfile(offenderNo)
      } catch (error) {
        logger.error(error, 'Error during getViolenceProfile')
        throw error
      }
    },

    async getExtremismProfile(offenderNo, context, previousOffences) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(context)
        return await riskProfilerClient.getExtremismProfile(offenderNo, previousOffences)
      } catch (error) {
        logger.error(error, 'Error during getExtremismProfile')
        throw error
      }
    },

    async getLifeProfile(offenderNo, context) {
      try {
        const riskProfilerClient = riskProfilerClientBuilder(context)
        return await riskProfilerClient.getLifeProfile(offenderNo)
      } catch (error) {
        logger.error(error, 'Error during getLifeProfile')
        throw error
      }
    },
  }
}
