import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
} from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'

import { EscapeAlertDto } from '../data/alertsApi/escapeAlert.dto'

interface SummarisedAlertData {
  alertCode: string
  dateCreated: string
  active: boolean
}

export interface EscapeProfile {
  activeEscapeList: boolean
  activeEscapeRisk: boolean
  escapeListAlerts: SummarisedAlertData[]
  escapeRiskAlerts: SummarisedAlertData[]
  riskType: 'ESCAPE'
}

const filterForActive = (data: EscapeAlertDto[], ...codes: string[]): EscapeAlertDto[] =>
  data.filter(alert => codes.includes(alert.alertCode?.code) && alert.isActive)

const summariseEscapeAlerts = (alerts: EscapeAlertDto[], ...codes: string[]): SummarisedAlertData[] => {
  return alerts
    .filter(alert => codes.includes(alert.alertCode?.code))
    .map(alert => ({
      alertCode: alert.alertCode?.code,
      dateCreated: alert.activeFrom,
      active: alert.isActive,
    }))
}

export const transformDataToEscapeProfile = (data: EscapeAlertDto[]): EscapeProfile => {
  const activeEscapeListAlerts = filterForActive(data, ESCAPE_LIST_ALERT_CODE, ESCAPE_LIST_HEIGHTENED_ALERT_CODE)
  const activeEscapeRiskAlerts = filterForActive(data, ESCAPE_RISK_ALERT_CODE)

  const escapeListAlertsSummary = summariseEscapeAlerts(data, ESCAPE_LIST_ALERT_CODE, ESCAPE_LIST_HEIGHTENED_ALERT_CODE)
  const escapeRiskAlertsSummary = summariseEscapeAlerts(data, ESCAPE_RISK_ALERT_CODE)

  return {
    activeEscapeList: activeEscapeListAlerts.length > 0,
    activeEscapeRisk: activeEscapeRiskAlerts.length > 0,
    escapeListAlerts: escapeListAlertsSummary,
    escapeRiskAlerts: escapeRiskAlertsSummary,
    riskType: 'ESCAPE',
  }
}
