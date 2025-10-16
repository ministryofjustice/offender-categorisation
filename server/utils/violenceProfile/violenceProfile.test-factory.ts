import { RISK_TYPE_VIOLENCE, ViolenceProfile } from './violenceProfile'

export const makeTestViolenceProfile = (violenceProfile: Partial<ViolenceProfile> = {}): ViolenceProfile => ({
  notifyRegionalCTLead: violenceProfile.notifyRegionalCTLead ?? false,
  numberOfAssaults: violenceProfile.numberOfAssaults ?? 0,
  numberOfSeriousAssaults: violenceProfile.numberOfSeriousAssaults ?? 0,
  numberOfNonSeriousAssaults: violenceProfile.numberOfNonSeriousAssaults ?? 0,
  riskType: RISK_TYPE_VIOLENCE,
})
