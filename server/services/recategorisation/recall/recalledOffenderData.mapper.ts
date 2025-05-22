import { PrisonApiPrisonPeriodsDto } from "../../../data/nomis/prisonTimeline/PrisonApiPrisonPeriods.dto";
import { RecalledOffenderData } from "./recalledOffenderData";
import moment from "moment/moment";

export const mapFromPrisonApiPrisonPeriodsDto = (prisonApiPrisonPeriodsDto: PrisonApiPrisonPeriodsDto, bookingId): RecalledOffenderData => {
  const dateInPrisonSortedDesc = prisonApiPrisonPeriodsDto.prisonPeriod?.movementDates.sort(
    (a, b) => moment(b.dateInToPrison).valueOf() - moment(a.dateInToPrison).valueOf(),
  )
}
