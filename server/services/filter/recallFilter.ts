import moment from 'moment'
import { RecategorisationPrisonerSearchDto } from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto'

export interface RecalledOffenderData {
  recallDate: string
  dueDateBasedOnRecallDate: string
  lastDateInToPrison: string
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
  const results = await Promise.all(
    prisoners.map(async prisoner => {
      const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)

      if (currentPrisonerSearchData?.recall) {
        await setDatesForRecalledPrisoners(
          nomisClient,
          prisoner.offenderNo || prisoner.prisonerNumber,
          prisoner.bookingId,
          currentPrisonerSearchData,
        )

        if (isFixedTermRecallLessThanAndEqualTo28Days(currentPrisonerSearchData)) {
          return false // Filter out
        }
      }

      return true
    }),
  )

  return prisoners.filter((_, index) => results[index])
}
