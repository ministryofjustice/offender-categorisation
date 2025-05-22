import moment from 'moment'
import { RecategorisationPrisonerSearchDto } from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto'
import {PrisonerSearchAlertDto} from "../../data/prisonerSearch/alert/prisonerSearchAlert.dto";
import {
  PrisonerSearchIncentiveLevelDto
} from "../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto";
import type {LegalStatus} from "../../data/prisonerSearch/prisonerSearch.dto";

export interface RecalledPrisonerData extends RecategorisationPrisonerSearchDto{
  dueDateForRecalls: string | undefined
  lastDateInPrison: string | undefined
}

export const setDatesForRecalledPrisoners = async (
  nomisClient,
  offenderNo: string,
  bookingId: number,
  recatPrisonerSearchDto: RecategorisationPrisonerSearchDto,
) => {
  const response = await nomisClient.getOffenderPrisonPeriods(offenderNo)
  const prisonPeriodForBookingId = response.prisonPeriod.find(p => p.bookingId === bookingId)
  if (prisonPeriodForBookingId) {
    const dateInPrisonSortedDesc = prisonPeriodForBookingId.movementDates.sort(
      (a, b) => moment(b.dateInToPrison).valueOf() - moment(a.dateInToPrison).valueOf(),
    )
    // Record dates for recalled prisoners
    // eslint-disable-next-line no-param-reassign
    recatPrisonerSearchDto.dueDateForRecalls = dueDateForRecalls(dateInPrisonSortedDesc[0].dateInToPrison)
    // eslint-disable-next-line no-param-reassign
    recatPrisonerSearchDto.lastDateInPrison = moment(dateInPrisonSortedDesc[0].dateInToPrison).format('YYYY-MM-DD')
  }
}

export const isFixedTermRecallLessThanAndEqualTo28Days = (
  recatPrisonerSearchDto: RecategorisationPrisonerSearchDto,
) => {
  const FIXED_TERM_RECALL_DAYS_LIMIT = 28
  if (recatPrisonerSearchDto.postRecallReleaseDate) {
    // Fixed term recall
    const differenceInDays = Math.abs(
      moment(recatPrisonerSearchDto.postRecallReleaseDate, 'YYYY-MM-DD').diff(
        moment(recatPrisonerSearchDto.lastDateInPrison, 'YYYY-MM-DD'),
        'days',
      ),
    )
    return differenceInDays <= FIXED_TERM_RECALL_DAYS_LIMIT
  }
  return false
}

const dueDateForRecalls = (lastDateInPrison: string) => {
  const OVERDUE_LIMIT_FOR_RECALLS = 10
  const tt = moment(lastDateInPrison).add(OVERDUE_LIMIT_FOR_RECALLS, 'days').format('YYYY-MM-DD')
  return tt
}

export const filterOutRecalledPrisoners = async (
  prisoners,
  prisonerSearchData: Map<number, RecategorisationPrisonerSearchDto>,
  nomisClient,
) => {
  const prisonersToBeDisplayed = []

  for (const prisoner of prisoners) {
    const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)
    if (currentPrisonerSearchData?.recall) {
      if (!isFixedTermRecallLessThanAndEqualTo28Days(currentPrisonerSearchData)) {
        prisonersToBeDisplayed.push(prisoner)
      }
    } else {
      prisonersToBeDisplayed.push(prisoner)
    }
  }

  return prisonersToBeDisplayed
}
