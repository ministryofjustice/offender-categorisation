export const INCENTIVE_LEVEL_BASIC = 'BAS'
export const INCENTIVE_LEVEL_STANDARD = 'STD'
export const INCENTIVE_LEVEL_ENHANCED = 'ENH'
export const INCENTIVE_LEVEL_ENHANCED_TWO = 'EN2'
export const INCENTIVE_LEVEL_ENHANCED_THREE = 'EN3'

export interface PrisonerSearchIncentiveLevelDto {
  level: {
    code: string // code has been left as type string rather than an enum of the incentive level consts above because new levels can be added by individual prisons to represent incentive levels
    description: string
  }
  dateTime: string
  nextReviewDate: string
}
