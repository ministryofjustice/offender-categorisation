const riskProfileHelper = require('../../server/utils/riskChange.js')

describe('it should assess the risk change status of a new and old risk profile ', () => {
  it('Change in escape list status is detected', () => {
    const oldProfile = buildProfile({ activeEscapeList: false })
    const newProfile = buildProfile({ activeEscapeList: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeList).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRisk).toBe(false)
  })
  it('Change in escape risk status is detected', () => {
    const oldProfile = buildProfile({ activeEscapeRisk: false })
    const newProfile = buildProfile({ activeEscapeRisk: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRisk).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeList).toBe(false)
  })
  it('Changes in escape risk alerts are detected', () => {
    const oldProfile = buildProfile({
      escapeRiskAlerts: [{ newAlert: 'something1', alertId: '1' }, { alertId: '2', newAlert: 'something2' }],
    })
    const newProfile = buildProfile({
      escapeRiskAlerts: [{ newAlert: 'somethingHasChanged', alertId: '1' }, { newAlert: 'something1', alertId: '2' }],
    })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRiskAlert).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeListAlert).toBe(false)
  })
  it('Changes in escape list alerts are detected', () => {
    const oldProfile = buildProfile({ escapeListAlerts: [], escapeRiskAlerts: [{ alertId: '2' }, { alertId: '1' }] })
    const newProfile = buildProfile({
      escapeListAlerts: [{ newAlert: 'something' }],
      escapeRiskAlerts: [{ alertId: '1' }, { alertId: '2' }],
    })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeListAlert).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRiskAlert).toBe(false)
  })
})

function buildProfile({
  activeEscapeRisk = false,
  activeEscapeList = false,
  escapeRiskAlerts = [],
  escapeListAlerts = [],
}) {
  return {
    escape: { activeEscapeList, activeEscapeRisk, escapeRiskAlerts, escapeListAlerts },
  }
}
