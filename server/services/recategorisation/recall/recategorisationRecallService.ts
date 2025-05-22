import { RecategorisationPrisonerSearchDto } from '../prisonerSearch/recategorisationPrisonerSearch.dto'
import { RecalledOffenderData } from './recalledOffenderData'

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
  prisonerSearchData: Map<number, RecategorisationPrisonerSearchDto>,
  nomisClient,
): Promise<Map<string, RecalledOffenderData>> => {
  const recalledOffenderNumbersToRecallData: Map<string, RecalledOffenderData> = new Map()

  const recalledPrisonerSearchData = Array.from(prisonerSearchData.values()).filter(
    recategorisationPrisonerSearchData => recategorisationPrisonerSearchData.recall,
  )
  await Promise.all(
    recalledPrisonerSearchData.map(async recalledPrisonerSearchDatum => {
      const recalledOffenderData = await getRecalledOffenderData(
        recalledPrisonerSearchDatum.prisonerNumber,
        recalledPrisonerSearchDatum.bookingId,
        nomisClient,
      )
      if (typeof recalledOffenderData !== 'undefined') {
        recalledOffenderNumbersToRecallData.set(recalledPrisonerSearchDatum.prisonerNumber, recalledOffenderData)
      }
    }),
  )
  return recalledOffenderNumbersToRecallData
}
