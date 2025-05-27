import { RecategorisationPrisonerSearchDto } from '../prisonerSearch/recategorisationPrisonerSearch.dto'
import { RecalledOffenderData } from './recalledOffenderData'
import logger from '../../../../log'

const getRecalledOffenderData = async (
  offenderNumber: string,
  bookingId: number,
  nomisClient,
): Promise<RecalledOffenderData | undefined> => {
  const response = await nomisClient.getOffenderPrisonPeriods(offenderNumber)
  const prisonPeriodForBookingId = response.prisonPeriod.find(p => Number(p.bookingId) === bookingId)
  logger.info(
    `recategorisationDashboardErrorInvestigation_recalls: response = ${response}, prison period for booking ID = ${prisonPeriodForBookingId}`,
  )
  if (prisonPeriodForBookingId) {
    const movementDatesSortedByDateInToPrisonDesc = prisonPeriodForBookingId.movementDates.sort(
      (a, b) => new Date(b.dateInToPrison).getTime() - new Date(a.dateInToPrison).getTime(),
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
