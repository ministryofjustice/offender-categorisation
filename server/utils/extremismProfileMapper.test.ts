import { mapDataToExtremismProfile } from './extremismProfileMapper'

describe('mapDataToExtremismProfile', () => {
  it('returns true for notifyRegionalCtLead and increasedRiskOfExtremism when band is 1', () => {
    expect(mapDataToExtremismProfile(1)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: true })
  })

  it('returns true for notifyRegionalCTLead and increasedRiskOfExtremism when band is 2', () => {
    expect(mapDataToExtremismProfile(2)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: true })
  })

  it('returns true for notifyRegionalCTLead and false for increasedRiskOfExtremism when band is 3', () => {
    expect(mapDataToExtremismProfile(3)).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: false })
  })

  it('returns false for notifyRegionalCTLead and increasedRiskOfExtremism when band is an invalid number', () => {
    expect(mapDataToExtremismProfile(4)).toEqual({ notifyRegionalCTLead: false, increasedRiskOfExtremism: false })
  })

  it('returns false for notifyRegionalCTLead and increasedRiskOfExtremism when no param is passed in', () => {
    expect(mapDataToExtremismProfile()).toEqual({ notifyRegionalCTLead: false, increasedRiskOfExtremism: false })
  })
})
