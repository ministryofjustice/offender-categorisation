export const RISK_TYPE_VIOLENCE = 'VIOLENCE'

export interface ViolenceProfile {
  notifyRegionalCTLead: boolean
  numberOfAssaults: number
  numberOfSeriousAssaults: number
  numberOfNonSeriousAssaults: number
  riskType: typeof RISK_TYPE_VIOLENCE
}
