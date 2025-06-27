import logger = require('../../log')

import { transformDataToEscapeProfile, EscapeProfile } from '../utils/riskServiceHelpers'

export default class CreateRiskService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly alertsApiClientBuilder) {}

  async getEscapeProfile(offenderNo: string, user: { username: string }): Promise<EscapeProfile> {
    try {
      const alertsApiClient = this.alertsApiClientBuilder(user)
      const response = await alertsApiClient.getActivePrisonerEscapeAlerts(offenderNo)
      const escapeProfile = transformDataToEscapeProfile(response.content)
      return escapeProfile
    } catch (error) {
      logger.error(error)
      throw error
    }
  }
}
