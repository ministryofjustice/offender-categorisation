const riskProfileHelper = require('../../server/utils/riskChange')

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
      escapeRiskAlerts: [
        { newAlert: 'something1', alertId: '1' },
        { alertId: '2', newAlert: 'something2' },
      ],
    })
    const newProfile = buildProfile({
      escapeRiskAlerts: [
        { newAlert: 'somethingHasChanged', alertId: '1' },
        { newAlert: 'something1', alertId: '2' },
      ],
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
  it('Changes in violence assaults are ignored if no recommended cat change', () => {
    const oldProfile = buildProfile({ numberOfAssaults: 0 })
    const newProfile = buildProfile({ numberOfAssaults: 1, notifySafetyCustodyLead: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceChange).toBe(false)
  })
  it('Change in violence recommendation is detected', () => {
    const oldProfile = buildProfile({})
    const newProfile = buildProfile({ provisionalCategorisation: 'B' })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceChange).toBe(true)
  })
  it('Changes in soc referral notify lead', () => {
    const oldProfile = buildProfile({ transferToSecurity: false })
    const newProfile = buildProfile({ transferToSecurity: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).socNewlyReferred).toBe(true)
  })
  it('Change in escape list status is detected with new profile structure', () => {
    const oldProfile = { escapeListAlerts: [] }
    const newProfile = { escapeListAlerts: [{ createdDate: '2025-01-01' }] }
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeList).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeListAlert).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRisk).toBe(false)
  })
  it('Change in escape risk status is detected with new profile structure', () => {
    const oldProfile = { escapeRiskAlerts: [] }
    const newProfile = { escapeRiskAlerts: [{ createdDate: '2025-01-01' }] }
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRisk).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeRiskAlert).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).escapeList).toBe(false)
  })
  it('Change in violence risk is detected with new profile structure', () => {
    const oldProfile = { riskDueToViolence: false }
    const newProfile = { riskDueToViolence: true }
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceChange).toBe(true)
  })
  it('Change in violence risk is detected with new profile structure', () => {
    const oldProfile = { riskDueToSeriousOrganisedCrime: false }
    const newProfile = { riskDueToSeriousOrganisedCrime: true }
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).socNewlyReferred).toBe(true)
  })
})

function buildProfile({
  activeEscapeRisk = false,
  activeEscapeList = false,
  escapeRiskAlerts = [],
  escapeListAlerts = [],
  numberOfAssaults = 0,
  provisionalCategorisation = 'C',
  notifySafetyCustodyLead = false,
  transferToSecurity = false,
} = {}) {
  return {
    escape: { activeEscapeList, activeEscapeRisk, escapeRiskAlerts, escapeListAlerts },
    violence: { numberOfAssaults, provisionalCategorisation, notifySafetyCustodyLead },
    soc: { transferToSecurity },
  }
}
