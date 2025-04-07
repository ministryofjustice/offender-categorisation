import moment from 'moment'
import { RecategorisationPrisonerSearchDto } from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto'
import {
  ESCAPE_LIST_ALERT_CODE,
  ESCAPE_LIST_HEIGHTENED_ALERT_CODE,
  ESCAPE_RISK_ALERT_CODE,
  NOT_FOR_RELEASE_ALERT_CODE,
  RESTRICTED_ROTL_ALERT_CODE,
  ROTL_SUSPENSION_ALERT_CODE,
  TERRORIST_ACT_ALERT_CODE,
} from '../../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import {
  INCENTIVE_LEVEL_ENHANCED,
  INCENTIVE_LEVEL_ENHANCED_THREE,
  INCENTIVE_LEVEL_ENHANCED_TWO,
  INCENTIVE_LEVEL_STANDARD,
} from '../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'
import { NomisAdjudicationHearingDto } from '../../data/nomis/adjudicationHearings/nomisAdjudicationHearing.dto'
import { isReviewOverdue } from '../reviewStatusCalculator'
import { PrisonerAllocationDto } from '../../data/allocationManager/prisonerAllocation.dto'
import { ProbationOffenderSearchApiClient } from '../../data/probationOffenderSearch/probationOffenderSearchApiClient'
import { RisksAndNeedsApiClient } from '../../data/risksAndNeeds/risksAndNeedsApi'
import { OverallRiskLevel } from '../../data/risksAndNeeds/riskSummary.dto'
import logger from '../../../log'

export const SUITABILIGY_FOR_OPEN_CONDITIONS = 'suitabilityForOpenConditions'
export const DUE_DATE = 'dueDate'
export const POM = 'pom'

export const LOW_RISK_OF_ESCAPE = 'lowRiskOfEscape'
export const LOW_ROSH = 'lowRosh'
export const NO_CURRENT_TERRORISM_OFFENCES = 'noCurrentTerrorismOffences'
export const NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS = 'noRotlRestrictionsOrSuspensions'
export const NOT_MARKED_AS_NOT_FOR_RELEASE = 'notMarkedAsNotForRelease'
export const STANDARD_OR_ENHANCED_INCENTIVE_LEVEL = 'standardOrEnhancedIncentiveLevel'
export const TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS = 'timeLeftToServeBetween12WeeksAnd3Years'
export const NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS = 'noAdjudicationsInTheLastThreeMonths'
export const OVERDUE = 'overdue'
export const REVIEWS_ASSIGNED_TO_ME = 'reviewsAssignedToMe'

export type RecategorisationHomeFilterSuitabilityForOpenConditionsValue =
  | typeof LOW_RISK_OF_ESCAPE
  | typeof LOW_ROSH
  | typeof NO_CURRENT_TERRORISM_OFFENCES
  | typeof NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS
  | typeof NOT_MARKED_AS_NOT_FOR_RELEASE
  | typeof STANDARD_OR_ENHANCED_INCENTIVE_LEVEL
  | typeof TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS
  | typeof NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS
export type HomeFilterDueDateValue = typeof OVERDUE
export type HomeFilterPomValue = typeof REVIEWS_ASSIGNED_TO_ME

interface CommonHomeFilters {
  [DUE_DATE]: Array<HomeFilterDueDateValue>
  [POM]: Array<HomeFilterPomValue>
}
export interface RecategorisationHomeFilters extends CommonHomeFilters {
  [SUITABILIGY_FOR_OPEN_CONDITIONS]: Array<RecategorisationHomeFilterSuitabilityForOpenConditionsValue>
}

export interface CategorisationHomeFilters extends CommonHomeFilters {}

const CommonHomeFilters = {
  [POM]: { [REVIEWS_ASSIGNED_TO_ME]: 'Reviews assigned to me' },
  [DUE_DATE]: { [OVERDUE]: 'Overdue reviews' },
}

export const categorisationHomeFilters = {
  ...CommonHomeFilters,
}

export const recategorisationHomeFilters = {
  [SUITABILIGY_FOR_OPEN_CONDITIONS]: {
    [LOW_ROSH]: 'Low RoSH',
    [LOW_RISK_OF_ESCAPE]: 'Low risk of escape',
    [NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS]: 'No adjudications in the last 3 months',
    [NO_CURRENT_TERRORISM_OFFENCES]: 'No current terrorism offences',
    [NO_ROTL_RESTRICTIONS_OR_SUSPENSIONS]: 'No ROTL restrictions or suspensions',
    [NOT_MARKED_AS_NOT_FOR_RELEASE]: "Not marked as 'Not for release'",
    [STANDARD_OR_ENHANCED_INCENTIVE_LEVEL]: 'Standard or Enhanced incentive level',
    [TIME_LEFT_TO_SERVE_BETWEEN_12_WEEKS_AND_3_YEARS]: 'Time left to serve is between 12 weeks and 3 years',
  },
  ...CommonHomeFilters,
}

export const recategorisationHomeFilterKeys = {
  [SUITABILIGY_FOR_OPEN_CONDITIONS]: 'Suitability for open conditions',
  [DUE_DATE]: 'Due date',
  [POM]: 'POM',
}

const dateIsNotBetween12WeeksAnd3Years = (dateString: string): boolean =>
  moment(dateString).isAfter(moment().add(3, 'years')) || moment(dateString).isBefore(moment().add(12, 'weeks'))

const getDateNMonthsAgo = (n: number) => {
  return moment().subtract(n, 'month').format('YYYY-MM-DD')
}

/**
 * The adjudications endpoint only allows requests for 31 days or less, therefore, to load all 3 weeks, we have to make
 * three calls to the endpoint and concatenate the data.
 *
 * @param prisoners
 * @param nomisClient
 * @param agencyId
 */
const loadAdjudicationsData = async (
  prisoners,
  nomisClient,
  agencyId: string
): Promise<NomisAdjudicationHearingDto[]> => {
  const prisonerNumbers = prisoners.map(prisoner => prisoner.offenderNo)
  if (prisonerNumbers.length <= 0) {
    return []
  }
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

const getOffenderNumbersWithLowRoshScore = async (
  prisoners,
  risksAndNeedsClient: RisksAndNeedsApiClient,
  probationOffenderSearchClient: ProbationOffenderSearchApiClient
) => {
  const prisonerNumbersWithLowRoshScore = []
  const prisonerNumbers = prisoners.map(prisoner => prisoner.offenderNo)
  let startTime = Date.now()
  const probationOffenderSearchOffenders = await probationOffenderSearchClient.matchPrisoners(prisonerNumbers)
  logger.info(`CAT prioritisation filter investigation: fetching crns took ${Date.now() - startTime}ms`)
  if (typeof probationOffenderSearchOffenders === 'undefined') {
    return []
  }
  const crnsToOffenderNumbers = Object.fromEntries(
    probationOffenderSearchOffenders.map(probationOffenderSearchOffender => [
      probationOffenderSearchOffender.otherIds.crn,
      probationOffenderSearchOffender.otherIds.nomsNumber,
    ])
  )
  startTime = Date.now()
  let crnsWithNoRoshLevel = 0
  const BATCH_SIZE = 50
  for (let range = 0; range < Object.keys(crnsToOffenderNumbers).length; range += BATCH_SIZE) {
    const crnBatch = Object.keys(crnsToOffenderNumbers).slice(range, range + BATCH_SIZE)
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      // eslint-disable-next-line no-loop-func
      crnBatch.map(async crn => {
        const risksSummary = await risksAndNeedsClient.getRisksSummary(crn)
        if (typeof risksSummary.overallRiskLevel === 'undefined') {
          crnsWithNoRoshLevel += 1
        }
        if (risksSummary.overallRiskLevel === OverallRiskLevel.low) {
          prisonerNumbersWithLowRoshScore.push(crnsToOffenderNumbers[crn])
        }
      })
    )
  }
  logger.info(`CAT prioritisation filter investigation: fetching RoSH took ${Date.now() - startTime}ms`)
  logger.info(`CAT prioritisation filter investigation: ${crnsWithNoRoshLevel} crns without RoSH level`)
  return prisonerNumbersWithLowRoshScore
}

export const filterListOfPrisoners = async (
  filters: RecategorisationHomeFilters | CategorisationHomeFilters | {},
  prisoners,
  prisonerSearchData: Map<number, RecategorisationPrisonerSearchDto> | any,
  nomisClient,
  agencyId: string,
  pomMap: Map<string, PrisonerAllocationDto>,
  userStaffId: number,
  risksAndNeedsClient: RisksAndNeedsApiClient,
  probationOffenderSearchClient: ProbationOffenderSearchApiClient
) => {
  const allFilterArrays = Object.values(filters)
  const allFilters = allFilterArrays.flat() || []
  if (allFilters.length <= 0) {
    return prisoners
  }
  // in order to improve load time we should apply any filters which don't require further data to be loaded first
  const allFiltersWhichDoNotRequireFurtherDataToBeLoaded = allFilters.filter(
    filter => ![NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS, LOW_ROSH].includes(filter)
  )
  let filteredPrisoners = prisoners.filter(prisoner => {
    const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)
    const activeNonExpiredAlertCodes =
      (currentPrisonerSearchData &&
        currentPrisonerSearchData.alerts
          ?.filter(alert => alert.active && !alert.expired)
          .map(alert => alert.alertCode)) ||
      []
    const incentiveLevelCode = currentPrisonerSearchData?.currentIncentive?.level.code
    for (let i = 0; i < allFiltersWhichDoNotRequireFurtherDataToBeLoaded.length; i += 1) {
      switch (allFiltersWhichDoNotRequireFurtherDataToBeLoaded[i]) {
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
        case OVERDUE:
          if (!isReviewOverdue(prisoner.nextReviewDate)) {
            return false
          }
          break
        case REVIEWS_ASSIGNED_TO_ME:
          if (pomMap.get(prisoner.offenderNo)?.primary_pom?.staff_id !== userStaffId) {
            return false
          }
          break
        default:
          throw new Error(`Invalid filter type: ${allFiltersWhichDoNotRequireFurtherDataToBeLoaded[i]}`)
      }
    }
    return true
  })
  let adjudicationsDataPromise
  if (allFilters.includes(NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS)) {
    adjudicationsDataPromise = loadAdjudicationsData(filteredPrisoners, nomisClient, agencyId)
  }
  let offenderNumbersWithLowRoshScorePromise
  if (allFilters.includes(LOW_ROSH)) {
    offenderNumbersWithLowRoshScorePromise = getOffenderNumbersWithLowRoshScore(
      filteredPrisoners,
      risksAndNeedsClient,
      probationOffenderSearchClient
    )
  }
  const [adjudicationsData, offenderNumbersWithLowRoshScore] = await Promise.all([
    adjudicationsDataPromise,
    offenderNumbersWithLowRoshScorePromise,
  ])

  if (allFilters.includes(NO_ADJUDICATIONS_IN_THE_LAST_3_MONTHS)) {
    const offenderNumbersWithAdjudications = adjudicationsData.map(adjudicationsDatum => adjudicationsDatum.offenderNo)
    filteredPrisoners = filteredPrisoners.filter(prisoner => {
      return !offenderNumbersWithAdjudications.includes(prisoner.offenderNo)
    })
  }
  if (allFilters.includes(LOW_ROSH)) {
    filteredPrisoners = filteredPrisoners.filter(prisoner => {
      return offenderNumbersWithLowRoshScore.includes(prisoner.offenderNo)
    })
  }

  return filteredPrisoners
}
