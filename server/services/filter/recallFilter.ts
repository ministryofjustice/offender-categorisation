import moment from 'moment'
import { RecategorisationPrisonerSearchDto } from '../recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto'

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
    recatPrisonerSearchDto.lastDateInPrison = dateInPrisonSortedDesc[0].dateInToPrison
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
  return moment(lastDateInPrison, 'YYYY-MM-DD').add(OVERDUE_LIMIT_FOR_RECALLS, 'days').format('YYYY-MM-DD')
}

export const filterOutRecalledPrisoners = async (
  prisoners,
  prisonerSearchData: Map<number, RecategorisationPrisonerSearchDto>,
  nomisClient,
) => {
  return prisoners.filter(prisoner => {
    const currentPrisonerSearchData = prisonerSearchData.get(prisoner.bookingId)

    if (currentPrisonerSearchData && currentPrisonerSearchData.recall) {
      // set dates for recalled prisoners
      setDatesForRecalledPrisoners(nomisClient, prisoner.prisonerNumber, prisoner.bookingId, currentPrisonerSearchData)
      if (isFixedTermRecallLessThanAndEqualTo28Days(currentPrisonerSearchData)) {
        // Don't show in Recat dashboard
        return false
      }
    }

    return true
  })
}
