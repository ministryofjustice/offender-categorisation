const logger = require('../../log').default
const { properCaseName, setFemaleCaseLoads } = require('../utils/utils')

module.exports = function createUserService(nomisClientBuilder) {
  async function getUser(context) {
    return getUserByUserId(context)
  }

  async function getUserByUserId(context, userId) {
    try {
      const nomisClient = nomisClientBuilder(context)
      const user = userId ? await nomisClient.getUserByUserId(userId) : await nomisClient.getUser()

      const nomisActiveCaseLoads = user.activeCaseLoadId ? await nomisClient.getUserCaseLoads() : []
      const activeCaseLoads = setFemaleCaseLoads(nomisActiveCaseLoads)
      const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)
      return {
        ...user,
        displayName: `${properCaseName(user.lastName)}, ${properCaseName(user.firstName)}`,
        displayNameAlternative: `${properCaseName(user.firstName)} ${properCaseName(user.lastName)}`,
        activeCaseLoad,
        activeCaseLoads,
      }
    } catch (error) {
      logger.error('Error during getUserByUserId: ', error.stack)
      throw error
    }
  }

  return { getUser, getUserByUserId }
}
