export const LOW_RISK_OF_ESCAPE = 'lowRiskOfEscape'
const LOW_ROSH = 'lowRosh'
const NO_CURRENT_TERRORISM_OFFENCES = 'noCurrentTerrorismOffences'
const NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS = 'noRotlRestrictionsOrSuspensions'
const NOT_MARKED_AS_NOT_FOR_RELEASE = 'notMarkedAsNotForRelease'
const STANDARD_OR_ENHANCED_INCENTIVE_LEVEL = 'standardOrEnhancedIncentiveLevel'
const TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS = 'timeLeftToServeBetween12WeeksAnd3Years'
const NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS = 'noAdjudicationsInTheLastThreeMonths'

interface RecategorisationHomeFilters {
  suitabilityForOpenConditions: Array<
    | typeof LOW_RISK_OF_ESCAPE
    | typeof LOW_ROSH
    | typeof NO_CURRENT_TERRORISM_OFFENCES
    | typeof NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS
    | typeof NOT_MARKED_AS_NOT_FOR_RELEASE
    | typeof STANDARD_OR_ENHANCED_INCENTIVE_LEVEL
    | typeof TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS
    | typeof NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS
  >
}

export const recategorisationHomeFilters = {
  suitabilityForOpenConditions: {
    [LOW_ROSH]: 'Low RoSH',
    [LOW_RISK_OF_ESCAPE]: 'Low risk of escape',
    [NO_CURRENT_TERRORISM_OFFENCES]: 'No current terrorism offences',
    [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS]: 'No ROTL restrictions or suspensions',
    [NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS]: 'No adjudications in the last 3 months',
    [NOT_MARKED_AS_NOT_FOR_RELEASE]: "Not marked as 'Not for release'",
    [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL]: 'Standard or Enhanced incentive level',
    [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS]: 'Time left to serve is between 12 weeks and 3 years',
  },
}

const dateIsNotBetween12WeeksAnd3Years = (dateString: string): boolean => {
  const today = new Date()
  return (
    new Date(dateString) > new Date(new Date().setFullYear(new Date().getFullYear() + 3)) ||
    new Date(dateString) < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 84)
  )
}

const getDateThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return date
}

const loadAdjudicationsData = (prisoners, nomisClient, agencyId: string) => {
  const prisonerNumbers = prisoners.map(prisoner => prisoner.offenderNo)
  const dateThreeMonthsAgo = getDateThreeMonthsAgo()
  return nomisClient.getOffenderAdjudications(
    prisonerNumbers,
    dateThreeMonthsAgo.toDateString(),
    new Date().toDateString(),
    agencyId
  )
}

export const filterListOfPrisoners = (
  filters: RecategorisationHomeFilters,
  prisoners,
  prisonerSearchData,
  nomisClient,
  agencyId: string
) => {
  const allFilters = Object.values(filters)?.flat() || []
  if (allFilters.length <= 0) {
    return prisoners
  }
  let offenderNumbersWithAdjudications = []
  if (allFilters.includes(NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS)) {
    offenderNumbersWithAdjudications = loadAdjudicationsData(prisoners, nomisClient, agencyId).map(
      adjudicationsDatum => adjudicationsDatum.offenderNo
    )
  }
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
        case NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS:
          if (offenderNumbersWithAdjudications.includes(prisoner.offenderNo)) {
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
