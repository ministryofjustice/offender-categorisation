import logger = require('../../log')
import { EscapeProfile, mapAlertToEscapeProfile } from '../utils/escapeProfileMapper'

export default class CreateAlertService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly alertsApiClientBuilder) {}

  async getEscapeProfile(offenderNo: string, user: { username: string }): Promise<EscapeProfile> {
    try {
      const alertsApiClient = this.alertsApiClientBuilder(user)
      const response = await alertsApiClient.getActivePrisonerEscapeAlerts(offenderNo)
      return mapAlertToEscapeProfile(response.content)
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async prisonerHasActiveOcgmAlert(offenderNo: string, user: { username: string }): Promise<boolean> {
    try {
      const alertsApiClient = this.alertsApiClientBuilder(user)
      const response = await alertsApiClient.getActiveOCGMAlerts(offenderNo)
      return !response.content.isEmpty()
    } catch (error) {
      logger.error(error)
      throw error
    }
  }
}
