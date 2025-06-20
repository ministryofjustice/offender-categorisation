import { ESCAPE_LIST_ALERT_CODE, ESCAPE_RISK_ALERT_CODE } from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'

const filterForEscapeAlert = (data, code) => data.filter(item => item.alertCode?.code === code)

const summariseEscapeAlerts = alerts =>
  alerts.map(item => ({
    alertCode: item.alertCode?.code,
    dateCreated: item.activeFrom,
  }))

const transformDataToEscapeProfile = data => {
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
