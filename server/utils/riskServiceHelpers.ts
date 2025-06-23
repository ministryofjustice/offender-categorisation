import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
} from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'

interface AlertData {
  alertCode: {
    code: string
  }
  activeFrom: string
  isActive: boolean
}

interface SummarisedAlertData {
  alertCode: string
  dateCreated: string
  active: boolean
}

interface EscapeProfile {
  activeEscapeList: boolean
  activeEscapeRisk: boolean
  escapeListAlerts: SummarisedAlertData[]
  escapeRiskAlerts: SummarisedAlertData[]
  riskType: 'ESCAPE'
}

const filterForActive = (data: AlertData[], ...codes: string[]): AlertData[] =>
  data.filter(alert => codes.includes(alert.alertCode?.code) && alert.isActive)

const summariseEscapeAlerts = (alerts: AlertData[], ...codes: string[]): SummarisedAlertData[] => {
  return alerts
    .filter(alert => codes.includes(alert.alertCode?.code))
    .map(alert => ({
      alertCode: alert.alertCode?.code,
      dateCreated: alert.activeFrom,
      active: alert.isActive,
    }))
}

const transformDataToEscapeProfile = (data: AlertData[]): EscapeProfile => {
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

export = transformDataToEscapeProfile
