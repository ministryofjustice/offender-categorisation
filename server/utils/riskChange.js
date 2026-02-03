const { equals } = require('./functionalHelpers')

function listAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape?.escapeListAlerts || newP.escapeListAlerts
  const oldEscapeAlerts = oldP.escape?.escapeListAlerts || oldP.escapeListAlerts
  return !equals(newEscapeAlerts?.sort(), oldEscapeAlerts?.sort())
}

function riskAlertChange(oldP, newP) {
  const newEscapeAlerts = newP.escape?.escapeRiskAlerts || newP.escapeRiskAlerts
  const oldEscapeAlerts = oldP.escape?.escapeRiskAlerts || oldP.escapeRiskAlerts
  return !equals(newEscapeAlerts?.sort(alertCompare), oldEscapeAlerts?.sort(alertCompare))
}

function isNewlyOnTheEscapeList(oldP, newP) {
  const wasNotPreviouslyOnEscapeList = oldP.escape ? !oldP.escape.activeEscapeList : oldP.escapeListAlerts?.length === 0
  const isNowOnEscapeList = newP.escape ? newP.escape.activeEscapeList : newP.escapeListAlerts?.length > 0
  return wasNotPreviouslyOnEscapeList && isNowOnEscapeList
}

function isNewEscapeRisk(oldP, newP) {
  const wasNotPreviouslyEscapeRisk = oldP.escape ? !oldP.escape.activeEscapeRisk : oldP.escapeRiskAlerts?.length === 0
  const isNowEscapeRisk = newP.escape ? newP.escape.activeEscapeRisk : newP.escapeRiskAlerts?.length > 0
  return wasNotPreviouslyEscapeRisk && isNowEscapeRisk
}

function isNewlyReferredToSecurity(oldP, newP) {
  const oldRisk = oldP.soc?.transferToSecurity || oldP.riskDueToSeriousOrganisedCrime
  const newRisk = newP.soc?.transferToSecurity || newP.riskDueToSeriousOrganisedCrime
  return !oldRisk && newRisk
}

function changeInViolenceCategoryRecommendation(oldP, newP) {
  const wasNotPreviouslyRiskDueToViolence = oldP.violence
    ? oldP.violence.provisionalCategorisation === 'C'
    : !oldP.riskDueToViolence
  const isNowRiskDueToViolence = newP.violence
    ? newP.violence.provisionalCategorisation === 'B'
    : newP.riskDueToViolence

  return wasNotPreviouslyRiskDueToViolence && isNowRiskDueToViolence
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
