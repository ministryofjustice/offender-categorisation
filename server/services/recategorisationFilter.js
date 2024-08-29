const LOW_RISK_OF_ESCAPE = 'lowRiskOfEscape'
const LOW_ROSH = 'lowRosh'
const NO_CURRENT_TERRORISM_OFFENCES = 'noCurrentTerrorismOffences'
const NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS = 'noRotlRestrictionsOrSuspensions'
const NOT_MARKED_AS_NOT_FOR_RELEASE = 'notMarkedAsNotForRelease'
const STANDARD_OR_ENHANCED_INCENTIVE_LEVEL = 'standardOrEnhancedIncentiveLevel'
const TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS = 'timeLeftToServeBetween12WeeksAnd3Years'
const NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS = 'noAdjudicationsInTheLastThreeMonths'

const recategorisationHomeFilters = {
  suitabilityForOpenConditions: {
    [LOW_RISK_OF_ESCAPE]: 'Low risk of escape',
    [LOW_ROSH]: 'Low RoSH',
    [NO_CURRENT_TERRORISM_OFFENCES]: 'No current terrorism offences',
    [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS]: 'No ROTL restrictions or suspensions',
    [NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS]: 'No adjudications in the last 3 months',
    [NOT_MARKED_AS_NOT_FOR_RELEASE]: 'Not marked as not for release',
    [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL]: 'Standard or enhanced incentive level',
    [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS]: 'Time left to serve is between 12 weeks and 3 years',
  },
}

module.exports = {
  LOW_RISK_OF_ESCAPE,
  recategorisationHomeFilters,
}
