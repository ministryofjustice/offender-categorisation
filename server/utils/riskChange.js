const { equals } = require('../utils/functionalHelpers')

function listAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeListAlerts
  const oldEscapeAlerts = oldP.escape.escapeListAlerts
  // todo determine if only increase in alerts is communicated or any change (hard to detect if alerts have been removed and added)

  return !equals(newEscapeAlerts.sort(), oldEscapeAlerts.sort())
}

function riskAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeRiskAlerts
  const oldEscapeAlerts = oldP.escape.escapeRiskAlerts
  // todo determine if only increase in alerts is communicated or any change (hard to detect if alerts have been removed and added)

  return !equals(newEscapeAlerts.sort(alertCompare), oldEscapeAlerts.sort(alertCompare))
}

function isNewlyOnTheEscapeList(oldP, newP) {
  const oldEscapeList = oldP.escape.activeEscapeList
  const newEscapeList = newP.escape.activeEscapeList
  return oldEscapeList === false && newEscapeList === true
}

function isNewEscapeRisk(oldP, newP) {
  const oldEscapeRisk = oldP.escape.activeEscapeRisk
  const newEscapeRisk = newP.escape.activeEscapeRisk
  return oldEscapeRisk === false && newEscapeRisk === true
}

const assessRiskProfiles = (oldP, newP) => {
  const escapeListAlert = listAlertChange(oldP, newP)
  const escapeRiskAlert = riskAlertChange(oldP, newP)
  const escapeList = isNewlyOnTheEscapeList(oldP, newP)
  const escapeRisk = isNewEscapeRisk(oldP, newP)
  return {
    escapeListAlert,
    escapeRiskAlert,
    escapeList,
    escapeRisk,
    alertRequired: false, // **disabled** escapeListAlert || escapeRiskAlert || escapeRisk || escapeList,
  }
}

function alertCompare(a, b) {
  const alertIdA = a.alertId
  const alertIdB = b.alertId
  if (alertIdA < alertIdB) {
    return -1
  }
  if (alertIdA > alertIdB) {
    return 1
  }
  return 0
}

module.exports = {
  assessRiskProfiles,
}
