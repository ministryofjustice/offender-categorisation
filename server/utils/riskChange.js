const { equals } = require('../utils/functionalHelpers')

function listAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeListAlerts
  const oldEscapeAlerts = oldP.escape.escapeListAlerts
  return !equals(newEscapeAlerts.sort(), oldEscapeAlerts.sort())
}

function riskAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape.escapeRiskAlerts
  const oldEscapeAlerts = oldP.escape.escapeRiskAlerts
  return !equals(newEscapeAlerts.sort(alertCompare), oldEscapeAlerts.sort(alertCompare))
}

function isNewlyOnTheEscapeList(oldP, newP) {
  const oldEscapeList = oldP.escape.activeEscapeList
  const newEscapeList = newP.escape.activeEscapeList
  return !oldEscapeList && newEscapeList
}

function isNewEscapeRisk(oldP, newP) {
  const oldEscapeRisk = oldP.escape.activeEscapeRisk
  const newEscapeRisk = newP.escape.activeEscapeRisk
  return !oldEscapeRisk && newEscapeRisk
}

function isNewlyReferredToSecurity(oldP, newP) {
  const oldRisk = oldP.soc.transferToSecurity
  const newRisk = newP.soc.transferToSecurity
  return !oldRisk && newRisk
}

function nowRequiresNotifyRegionalCTLead(oldP, newP) {
  const oldNotify = oldP.extremism.notifyRegionalCTLead
  const newNotify = newP.extremism.notifyRegionalCTLead
  return !oldNotify && newNotify
}

function isIncreasedRiskOfExtremism(oldP, newP) {
  const oldNotify = oldP.extremism.increasedRiskOfExtremism
  const newNotify = newP.extremism.increasedRiskOfExtremism
  return !oldNotify && newNotify
}

function changeInViolenceCategoryRecommendation(oldP, newP) {
  const oldCategory = oldP.violence.provisionalCategorisation
  const newCategory = newP.violence.provisionalCategorisation
  return oldCategory === 'C' && newCategory === 'B'
}

const assessRiskProfiles = (oldP, newP) => {
  const escapeListAlert = listAlertChange(oldP, newP)
  const escapeRiskAlert = riskAlertChange(oldP, newP)
  const escapeList = isNewlyOnTheEscapeList(oldP, newP)
  const escapeRisk = isNewEscapeRisk(oldP, newP)
  const increasedRiskOfExtremism = isIncreasedRiskOfExtremism(oldP, newP)
  const notifyRegionalCTLeadExtremism = nowRequiresNotifyRegionalCTLead(oldP, newP)
  const violenceChange = changeInViolenceCategoryRecommendation(oldP, newP)
  const socNewlyReferred = isNewlyReferredToSecurity(oldP, newP)
  return {
    escapeListAlert,
    escapeRiskAlert,
    escapeList,
    escapeRisk,
    increasedRiskOfExtremism,
    notifyRegionalCTLeadExtremism,
    violenceChange,
    socNewlyReferred,
    alertRequired:
      escapeListAlert ||
      escapeRiskAlert ||
      escapeRisk ||
      escapeList ||
      increasedRiskOfExtremism ||
      notifyRegionalCTLeadExtremism ||
      violenceChange ||
      socNewlyReferred,
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
