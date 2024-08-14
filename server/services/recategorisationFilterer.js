const LOW_RISK_OF_ESCAPE = 'lowRiskOfEscape'
const NO_CURRENT_TERRORISM_OFFENCES = 'noCurrentTerrorismOffences'
const NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS = 'noRotlRestrictionsOrSuspensions'
const NOT_MARKED_AS_NOT_FOR_RELEASE = 'notMarkedAsNotForRelease'
const STANDARD_OR_ENHANCED_INCENTIVE_LEVEL = 'standardOrEnhancedIncentiveLevel'
const TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS = 'timeLeftToServeBetween12WeeksAnd3Years'

const recategorisationHomeFilters = {
  suitabilityForOpenConditions: {
    [LOW_RISK_OF_ESCAPE]: 'Low risk of escape',
    lowRosh: 'Low RoSH',
    [NO_CURRENT_TERRORISM_OFFENCES]: 'No current terrorism offences',
    [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS]: 'No ROTL restrictions or suspensions',
    noAdjudicationsInTheLastThreeMonths: 'No adjudications in the last 3 months',
    [NOT_MARKED_AS_NOT_FOR_RELEASE]: 'Not marked as not for release',
    [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL]: 'Standard or enhanced incentive level',
    [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS]: 'Time left to serve is between 12 weeks and 3 years',
  },
}

const dateIsNotBetween12WeeksAnd3Years = dateString => {
  const today = new Date()
  return (
    new Date(dateString) > new Date(new Date().setFullYear(new Date().getFullYear() + 3)) ||
    new Date(dateString) < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 84)
  )
}

const filterListOfPrisoners = (filters, prisoners, prisonerSearchData) => {
  const allFilters = Object.values(filters).flat()
  return prisoners.filter(prisoner => {
    const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)
    const alertCodes = currentPrisonerSearchData?.alerts.map(alert => alert.alertCode) || []
    const incentiveLevelCode = currentPrisonerSearchData?.currentIncentive.level.code
    for (let i = 0; i < allFilters.length; i += 1) {
      switch (allFilters[i]) {
        case LOW_RISK_OF_ESCAPE:
          if (alertCodes.includes('XER') || alertCodes.includes('XEL') || alertCodes.includes('XELH')) {
            return false
          }
          break
        case NO_CURRENT_TERRORISM_OFFENCES:
          if (alertCodes.includes('XTACT')) {
            return false
          }
          break
        case NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS:
          if (alertCodes.includes('RROTL') || alertCodes.includes('ROTL')) {
            return false
          }
          break
        case NOT_MARKED_AS_NOT_FOR_RELEASE:
          if (alertCodes.includes('XNR')) {
            return false
          }
          break
        case STANDARD_OR_ENHANCED_INCENTIVE_LEVEL:
          if (
            incentiveLevelCode !== 'STD' &&
            incentiveLevelCode !== 'ENH' &&
            incentiveLevelCode !== 'EN2' &&
            incentiveLevelCode !== 'EN3'
          ) {
            return false
          }
          break
        case TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS:
          if (dateIsNotBetween12WeeksAnd3Years(currentPrisonerSearchData?.releaseDate)) {
            return false
          }
          break
        default:
          throw new Error(`Invalid filter type: ${allFilters[i]}`)
      }
    }
    return true
  })
}

module.exports = {
  filterListOfPrisoners,
  recategorisationHomeFilters,
}
