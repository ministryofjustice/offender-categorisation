const logger = require('../../log.js')

module.exports = function createUserService(nomisClientBuilder) {
  async function getUser(token) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const user = await nomisClient.getUser()
      return user
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }

  return { getUser }
}
