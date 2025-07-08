import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
} from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'

import { Alert } from '../data/alertsApi/escapeAlert.dto'

interface SummarisedAlertData {
  alertCode: string
  dateCreated: string
}

export interface EscapeProfile {
  activeEscapeList: boolean
  activeEscapeRisk: boolean
  escapeListAlerts: SummarisedAlertData[]
  escapeRiskAlerts: SummarisedAlertData[]
  riskType: 'ESCAPE'
}

const filterForEscapeAlert = (data: Alert[], ...codes: string[]): Alert[] =>
  data.filter(alert => codes.includes(alert.alertCode?.code))

const summariseEscapeAlerts = (alerts: Alert[]): SummarisedAlertData[] => {
  return alerts.map(alert => ({
    alertCode: alert.alertCode?.code,
    dateCreated: alert.activeFrom,
  }))
}

export const mapAlertToEscapeProfile = (data: Alert[]): EscapeProfile => {
  const activeEscapeListAlerts = filterForEscapeAlert(data, ESCAPE_LIST_ALERT_CODE, ESCAPE_LIST_HEIGHTENED_ALERT_CODE)
  const activeEscapeRiskAlerts = filterForEscapeAlert(data, ESCAPE_RISK_ALERT_CODE)

  const activeEscapeListAlertsSummary = summariseEscapeAlerts(activeEscapeListAlerts)
  const activeEscapeRiskAlertsSummary = summariseEscapeAlerts(activeEscapeRiskAlerts)

  return {
    activeEscapeList: activeEscapeListAlerts.length > 0,
    activeEscapeRisk: activeEscapeRiskAlerts.length > 0,
    escapeListAlerts: activeEscapeListAlertsSummary,
    escapeRiskAlerts: activeEscapeRiskAlertsSummary,
    riskType: 'ESCAPE',
  }
}
