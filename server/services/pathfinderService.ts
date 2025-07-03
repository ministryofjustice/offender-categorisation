import logger = require('../../log')

export default class CreatePathfinderService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly pathfinderApiClientBuilder) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getExtremismProfile(offenderNo: string, user: { username: string }): Promise<any> {
    try {
      console.log('here!!!')
      const pathfinderApiClient = this.pathfinderApiClientBuilder(user)
      const response = await pathfinderApiClient.getExtremismProfile(offenderNo)

      return response
    } catch (error) {
      logger.error(error)
      throw error
    }
  }
}
