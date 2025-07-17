import { ExtremismProfile } from '../data/pathfinderApi/extremismProfile.dto'

const notifyRegionalCTLeadBands = [1, 2, 3]
const increasedRiskOfExtremismBands = [1, 2]

export const mapDataToExtremismProfile = (band?: number): ExtremismProfile => {
  if (typeof band !== 'number') {
    return { notifyRegionalCTLead: false, increasedRiskOfExtremism: false }
  }

  return {
    notifyRegionalCTLead: notifyRegionalCTLeadBands.includes(band),
    increasedRiskOfExtremism: increasedRiskOfExtremismBands.includes(band),
  }
}
