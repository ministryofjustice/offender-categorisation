import { off } from 'bunyan-format'
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
  prisonerSearchData: Map<string, RecategorisationPrisonerSearchDto>,
  nomisClient,
): Promise<Map<string, RecalledOffenderData>> => {
  const recalledOffenderNumbersToRecallData: Map<string, RecalledOffenderData> = new Map()

  const recalledOffenderNumbers = Array.from(prisonerSearchData.keys()).filter(
    offenderNumber => prisonerSearchData.get(offenderNumber).recall,
  )
  await Promise.all(
    recalledOffenderNumbers.map(async offenderNumber => {
      const recalledOffenderData = await getRecalledOffenderData(
        offenderNumber,
        prisonerSearchData.get(offenderNumber).bookingId,
        nomisClient,
      )
      if (typeof recalledOffenderData !== 'undefined') {
        recalledOffenderNumbersToRecallData.set(offenderNumber, recalledOffenderData)
      }
    }),
  )
  return recalledOffenderNumbersToRecallData
}
