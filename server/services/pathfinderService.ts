import logger = require('../../log')

import { transformDataToExtremismProfile } from '../utils/pathfinderServiceHelpers'

export default class CreatePathfinderService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly pathfinderApiClientBuilder) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getExtremismProfile(offenderNo: string, user: { username: string }): Promise<any> {
    try {
      const pathfinderApiClient = this.pathfinderApiClientBuilder(user)
      const response = await pathfinderApiClient.getExtremismProfile(offenderNo)
      const extremismProfile = transformDataToExtremismProfile(response?.band)

      return extremismProfile
    } catch (error) {
      if (error.status === 404) {
        return { notifyRegionalCTLead: false, increasedRiskOfExtremism: false }
      }

      logger.error(error)
      throw error
    }
  }
}
