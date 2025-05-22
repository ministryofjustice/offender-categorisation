import { RecalledOffenderData } from './recalledOffenderData'
import { RecategorisationPrisonerSearchDto } from '../prisonerSearch/recategorisationPrisonerSearch.dto'

const getRecalledOffenderData = async (
  offenderNumber: string,
  bookingId: number,
  nomisClient,
): Promise<RecalledOffenderData | undefined> => {
  const response = await nomisClient.getOffenderPrisonPeriods(offenderNumber)
  const prisonPeriodForBookingId = response.prisonPeriod.find(p => p.bookingId === bookingId)
  if (prisonPeriodForBookingId) {
    const movementDatesSortedByDateInToPrisonDesc = prisonPeriodForBookingId.movementDates.sort((a, b) =>
      b.dateInToPrison > a.dateInToPrison ? 1 : -1,
    )
    return {
      recallDate: movementDatesSortedByDateInToPrisonDesc[0].dateInToPrison,
    }
  }
  return undefined
}

export const getRecalledOffendersData = async (
  prisonerSearchData: Map<string, RecategorisationPrisonerSearchDto>,
  nomisClient,
): Promise<Map<string, RecalledOffenderData>> => {
  const recalledOffenderNumbersToRecallData: Map<string, RecalledOffenderData> = new Map()
  const recalledPrisonersPrisonerSearchData = new Map(
    [...prisonerSearchData.entries()].filter(
      ([_offenderNumber, recategorisationPrisonerSearchDto]) => recategorisationPrisonerSearchDto.recall === true,
    ),
  )
  await Promise.all(
    Object.keys(recalledPrisonersPrisonerSearchData).map(async offenderNumber => {
      const recalledOffenderData = await getRecalledOffenderData(
        offenderNumber,
        recalledPrisonersPrisonerSearchData.get(offenderNumber).bookingId,
        nomisClient,
      )
      if (typeof recalledOffenderData !== 'undefined') {
        recalledOffenderNumbersToRecallData.set(offenderNumber, recalledOffenderData)
      }
    }),
  )
  return recalledOffenderNumbersToRecallData
}
