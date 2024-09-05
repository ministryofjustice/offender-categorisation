import moment from 'moment'
import { RecategorisationPrisonerSearchDto } from './recategorisation/recategorisationPrisonerSearch.dto'
import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  NOT_FOR_RELEASE_ALERT_CODE,
  RESTRICTED_ROTL_ALERT_CODE,
  ROTL_SUSPENSION_ALERT_CODE,
  TERRORIST_ACT_ALERT_CODE,
} from '../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import {
  INCENTIVE_LEVEL_ENHANCED,
  INCENTIVE_LEVEL_ENHANCED_THREE,
  INCENTIVE_LEVEL_ENHANCED_TWO,
  INCENTIVE_LEVEL_STANDARD,
} from '../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'
import { NomisAdjudicationHearingDto } from '../data/nomis/adjudicationHearings/nomisAdjudicationHearing.dto'

export const LOW_RISK_OF_ESCAPE = 'lowRiskOfEscape'
const LOW_ROSH = 'lowRosh'
export const NO_CURRENT_TERRORISM_OFFENCES = 'noCurrentTerrorismOffences'
export const NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS = 'noRotlRestrictionsOrSuspensions'
export const NOT_MARKED_AS_NOT_FOR_RELEASE = 'notMarkedAsNotForRelease'
export const STANDARD_OR_ENHANCED_INCENTIVE_LEVEL = 'standardOrEnhancedIncentiveLevel'
export const TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS = 'timeLeftToServeBetween12WeeksAnd3Years'
export const NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS = 'noAdjudicationsInTheLastThreeMonths'

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

const getDateNMonthsAgo = (n: number) => {
  return moment().subtract(n, 'month').format('YYYY-MM-DD')
}

const loadAdjudicationsData = async (
  prisoners,
  nomisClient,
  agencyId: string
): Promise<NomisAdjudicationHearingDto[]> => {
  const prisonerNumbers = prisoners.map(prisoner => prisoner.offenderNo)
  const dateThreeMonthsAgo = getDateNMonthsAgo(3)
  const dateTwoMonthsAgo = getDateNMonthsAgo(2)
  const dateOneMonthAgo = getDateNMonthsAgo(1)
  const [adjudicationsThreeMonthsAgo, adjudicationsTwoMonthsAgo, adjudicationsLastMonth] = await Promise.all([
    nomisClient.getOffenderAdjudications(prisonerNumbers, dateThreeMonthsAgo, dateTwoMonthsAgo, agencyId),
    nomisClient.getOffenderAdjudications(prisonerNumbers, dateTwoMonthsAgo, dateOneMonthAgo, agencyId),
    nomisClient.getOffenderAdjudications(prisonerNumbers, dateOneMonthAgo, moment().format('YYYY-MM-DD'), agencyId),
  ])
  return [...adjudicationsThreeMonthsAgo, ...adjudicationsTwoMonthsAgo, ...adjudicationsLastMonth]
}

export const filterListOfPrisoners = async (
  filters: RecategorisationHomeFilters,
  prisoners,
  prisonerSearchData: Map<number, RecategorisationPrisonerSearchDto>,
  nomisClient,
  agencyId: string
) => {
  const allFilters = Object.values(filters)?.flat() || []
  if (allFilters.length <= 0) {
    return prisoners
  }
  let offenderNumbersWithAdjudications = []
  if (allFilters.includes(NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS)) {
    const adjudicationsData = await loadAdjudicationsData(prisoners, nomisClient, agencyId)
    offenderNumbersWithAdjudications = adjudicationsData.map(adjudicationsDatum => adjudicationsDatum.offenderNo)
  }
  return prisoners.filter(prisoner => {
    const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)
    const activeNonExpiredAlertCodes =
      (currentPrisonerSearchData &&
        currentPrisonerSearchData.alerts
          ?.filter(alert => alert.active && !alert.expired)
          .map(alert => alert.alertCode)) ||
      []
    const incentiveLevelCode = currentPrisonerSearchData?.currentIncentive?.level.code
    for (let i = 0; i < allFilters.length; i += 1) {
      switch (allFilters[i]) {
        case LOW_RISK_OF_ESCAPE:
          if (
            activeNonExpiredAlertCodes.includes(ESCAPE_RISK_ALERT_CODE) ||
            activeNonExpiredAlertCodes.includes(ESCAPE_LIST_ALERT_CODE) ||
            activeNonExpiredAlertCodes.includes(ESCAPE_LIST_HEIGHTENED_ALERT_CODE)
          ) {
            return false
          }
          break
        case NO_CURRENT_TERRORISM_OFFENCES:
          if (activeNonExpiredAlertCodes.includes(TERRORIST_ACT_ALERT_CODE)) {
            return false
          }
          break
        case NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS:
          if (
            activeNonExpiredAlertCodes.includes(RESTRICTED_ROTL_ALERT_CODE) ||
            activeNonExpiredAlertCodes.includes(ROTL_SUSPENSION_ALERT_CODE)
          ) {
            return false
          }
          break
        case NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS:
          if (offenderNumbersWithAdjudications.includes(prisoner.offenderNo)) {
            return false
          }
          break
        case NOT_MARKED_AS_NOT_FOR_RELEASE:
          if (activeNonExpiredAlertCodes.includes(NOT_FOR_RELEASE_ALERT_CODE)) {
            return false
          }
          break
        case STANDARD_OR_ENHANCED_INCENTIVE_LEVEL:
          if (
            incentiveLevelCode !== INCENTIVE_LEVEL_STANDARD &&
            incentiveLevelCode !== INCENTIVE_LEVEL_ENHANCED &&
            incentiveLevelCode !== INCENTIVE_LEVEL_ENHANCED_TWO &&
            incentiveLevelCode !== INCENTIVE_LEVEL_ENHANCED_THREE
          ) {
            return false
          }
          break
        case TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS:
          if (dateIsNotBetween12WeeksAnd3Years(currentPrisonerSearchData?.releaseDate)) {
            return false
          }
          break
        case LOW_ROSH:
          return true
        default:
          throw new Error(`Invalid filter type: ${allFilters[i]}`)
      }
    }
    return true
  })
}
