const logger = require('../../log.js')
const { properCaseName } = require('../utils/utils.js')

module.exports = function createUserService(nomisClientBuilder) {
  async function getUser(token) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const user = await nomisClient.getUser()

      const activeCaseLoads = user.activeCaseLoadId ? await nomisClient.getUserCaseLoads() : []
      const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)

      return {
        ...user,
        displayName: `${properCaseName(user.lastName)}, ${properCaseName(user.firstName)}`,
        activeCaseLoad,
        activeCaseLoads,
      }
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }

  return { getUser }
}
