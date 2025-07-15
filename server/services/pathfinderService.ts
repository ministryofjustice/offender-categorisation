import { ExtremismProfile } from '../data/pathfinderApi/escapeProfile.dto'
import logger = require('../../log')

import { mapDataToExtremismProfile } from '../utils/extremismProfileMapper'

export default class CreatePathfinderService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly pathfinderApiClientBuilder) {}

  async getExtremismProfile(offenderNo: string, user: { username: string }): Promise<ExtremismProfile> {
    try {
      const pathfinderApiClient = this.pathfinderApiClientBuilder(user)
      const response = await pathfinderApiClient.getPathfinderData(offenderNo)
      return mapDataToExtremismProfile(response?.band)
    } catch (error) {
      if (error.status === 404) {
        return { notifyRegionalCTLead: false, increasedRiskOfExtremism: false }
      }

      logger.error(error)
      throw error
    }
  }
}
