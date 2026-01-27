const { equals } = require('./functionalHelpers')

function listAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeListAlerts || newP.escapeListAlerts
  const oldEscapeAlerts = oldP.escape.escapeListAlerts || oldP.escapeListAlerts
  return !equals(newEscapeAlerts.sort(), oldEscapeAlerts.sort())
}

function riskAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeRiskAlerts || newP.escapeRiskAlerts
  const oldEscapeAlerts = oldP.escape.escapeRiskAlerts || oldP.escapeRiskAlerts
  return !equals(newEscapeAlerts.sort(alertCompare), oldEscapeAlerts.sort(alertCompare))
}

function isNewlyOnTheEscapeList(oldP, newP) {
  if (newP.escape && oldP.escape) {
    const oldEscapeList = oldP.escape.activeEscapeList
    const newEscapeList = newP.escape.activeEscapeList
    return !oldEscapeList && newEscapeList
  }
  return oldP.escapeListAlerts.isEmpty() && !newP.escapeListAlerts.isEmpty()
}

function isNewEscapeRisk(oldP, newP) {
  if (newP.escape && oldP.escape) {
    const oldEscapeRisk = oldP.escape.activeEscapeRisk
    const newEscapeRisk = newP.escape.activeEscapeRisk
    return !oldEscapeRisk && newEscapeRisk
  }
  return oldP.escapeRiskAlerts.isEmpty() && !newP.escapeRiskAlerts.isEmpty()
}

function isNewlyReferredToSecurity(oldP, newP) {
  const oldRisk = oldP.soc.transferToSecurity || oldP.riskDueToSeriousOrganisedCrime
  const newRisk = newP.soc.transferToSecurity || newP.riskDueToSeriousOrganisedCrime
  return !oldRisk && newRisk
}

function changeInViolenceCategoryRecommendation(oldP, newP) {
  const oldCategory = oldP.violence.provisionalCategorisation
  const newCategory = newP.violence.provisionalCategorisation
  return (oldCategory === 'C' && newCategory === 'B') || (!oldP.riskDueToViolence && newP.riskDueToViolence)
}

const assessRiskProfiles = (oldP, newP) => {
  const escapeListAlert = listAlertChange(oldP, newP)
  const escapeRiskAlert = riskAlertChange(oldP, newP)
  const escapeList = isNewlyOnTheEscapeList(oldP, newP)
  const escapeRisk = isNewEscapeRisk(oldP, newP)
  const violenceChange = changeInViolenceCategoryRecommendation(oldP, newP)
  const socNewlyReferred = isNewlyReferredToSecurity(oldP, newP)
  return {
    escapeListAlert,
    escapeRiskAlert,
    escapeList,
    escapeRisk,
    violenceChange,
    socNewlyReferred,
    alertRequired: escapeListAlert || escapeRiskAlert || escapeRisk || escapeList || violenceChange || socNewlyReferred,
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
