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
  it('Changes in violence assaults are detected', () => {
    const oldProfile = buildProfile({ numberOfAssaults: 0 })
    const newProfile = buildProfile({ numberOfAssaults: 1 })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceAssaultsChange).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceNotifySafetyCTLead).toBe(false)
  })
  it('Changes in violence serious assaults are detected', () => {
    const oldProfile = buildProfile({ numberOfSeriousAssaults: 0 })
    const newProfile = buildProfile({ numberOfSeriousAssaults: 1 })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceAssaultsChange).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceNotifySafetyCTLead).toBe(false)
  })
  it('Changes in violence notify lead', () => {
    const oldProfile = buildProfile({ notifySafetyCustodyLead: false })
    const newProfile = buildProfile({ notifySafetyCustodyLead: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceAssaultsChange).toBe(false)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).violenceNotifySafetyCTLead).toBe(true)
  })
  it('Changes in extremism notify lead', () => {
    const oldProfile = buildProfile({ notifyRegionalCTLead: false })
    const newProfile = buildProfile({ notifyRegionalCTLead: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).increasedRiskOfExtremism).toBe(false)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).notifyRegionalCTLeadExtremism).toBe(true)
  })
  it('Changes in extremism increasedRiskOfExtremism', () => {
    const oldProfile = buildProfile({ increasedRiskOfExtremism: false })
    const newProfile = buildProfile({ increasedRiskOfExtremism: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).increasedRiskOfExtremism).toBe(true)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).notifyRegionalCTLeadExtremism).toBe(false)
  })
  it('Changes in extremism increasedRiskOfExtremism change to false is ignored', () => {
    const oldProfile = buildProfile({ increasedRiskOfExtremism: true })
    const newProfile = buildProfile({ increasedRiskOfExtremism: false })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).increasedRiskOfExtremism).toBe(false)
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).notifyRegionalCTLeadExtremism).toBe(false)
  })
  it('Changes in soc referral notify lead', () => {
    const oldProfile = buildProfile({ transferToSecurity: false })
    const newProfile = buildProfile({ transferToSecurity: true })
    expect(riskProfileHelper.assessRiskProfiles(oldProfile, newProfile).socNewlyReferred).toBe(true)
  })
})

function buildProfile({
  activeEscapeRisk = false,
  activeEscapeList = false,
  escapeRiskAlerts = [],
  escapeListAlerts = [],
  numberOfAssaults = 0,
  numberOfSeriousAssaults = 0,
  notifySafetyCustodyLead = false,
  notifyRegionalCTLead = false,
  increasedRiskOfExtremism = false,
  transferToSecurity = false,
} = {}) {
  return {
    escape: { activeEscapeList, activeEscapeRisk, escapeRiskAlerts, escapeListAlerts },
    violence: { numberOfAssaults, numberOfSeriousAssaults, notifySafetyCustodyLead },
    extremism: { notifyRegionalCTLead, increasedRiskOfExtremism },
    soc: { transferToSecurity },
  }
}
