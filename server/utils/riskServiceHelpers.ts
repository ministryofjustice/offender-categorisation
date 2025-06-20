import { ESCAPE_LIST_ALERT_CODE, ESCAPE_RISK_ALERT_CODE } from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'

interface AlertData {
  alertCode: {
    code: string
  }
  activeFrom: string
}

interface SummarisedAlertData {
  alertCode: string
  dateCreated: string
}

interface EscapeProfile {
  activeEscapeList: boolean
  activeEscapeRisk: boolean
  escapeListAlerts: SummarisedAlertData[]
  escapeRiskAlerts: SummarisedAlertData[]
  riskType: 'ESCAPE'
}

const filterForEscapeAlert = (data: AlertData[], code: string): AlertData[] =>
  data.filter(item => item.alertCode?.code === code)

const summariseEscapeAlerts = (alerts: AlertData[]): SummarisedAlertData[] =>
  alerts.map(item => ({
    alertCode: item.alertCode?.code,
    dateCreated: item.activeFrom,
  }))

const transformDataToEscapeProfile = (data: AlertData[]): EscapeProfile => {
  const activeEscapeListAlerts = filterForEscapeAlert(data, ESCAPE_LIST_ALERT_CODE)
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

export = transformDataToEscapeProfile
