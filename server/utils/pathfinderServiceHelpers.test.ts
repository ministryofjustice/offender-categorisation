import { transformDataToExtremismProfile } from './pathfinderServiceHelpers'

describe('transformDataToExtremismProfile', () => {
  it('returns true for notifyRegionalCtLead and increasedRiskOfExtremism when band is 1', () => {
    expect(transformDataToExtremismProfile(1)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: true })
  })

  it('returns true for notifyRegionalCTLead and increasedRiskOfExtremism when band is 2', () => {
    expect(transformDataToExtremismProfile(2)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: true })
  })

  it('returns true for notifyRegionalCTLead and false for increasedRiskOfExtremism when band is 3', () => {
    expect(transformDataToExtremismProfile(3)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: false })
  })

  it('returns false for notifyRegionalCTLead and increasedRiskOfExtremism when band is an invalid number', () => {
    expect(transformDataToExtremismProfile(4)).toEqual({ notifyRegionalCTLead: false, increasedRiskOfExtremism: false })
  })

  it('returns false for notifyRegionalCTLead and increasedRiskOfExtremism when no param is passed in', () => {
    expect(transformDataToExtremismProfile()).toEqual({ notifyRegionalCTLead: false, increasedRiskOfExtremism: false })
  })
})
