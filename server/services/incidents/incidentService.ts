import { isAfter, subMonths, toDate } from 'date-fns'
import {
  INCIDENT_STATUS_DUPLICATE,
  NomisIncidentDto,
  QUESTION_ANSWER_YES,
  SERIOUS_ASSAULT_QUESTIONS,
} from '../../data/nomis/incidents/nomisIncident.dto'
import { CountOfAssaultIncidents } from './countOfAssaultIncidents'

const RECENT_ASSAULT_MONTHS = 12

export const getCountOfRecentAssaultsAndSeriousAssaultsFromAssaultIncidents = (
  assaultIncidents: NomisIncidentDto[],
): CountOfAssaultIncidents => {
  const nonDuplicateRecentAssaultIncidents = assaultIncidents
    .filter(assaultIncident => assaultIncident.incidentStatus !== INCIDENT_STATUS_DUPLICATE)
    .filter(
      assaultIncident =>
        assaultIncident.reportTime !== null &&
        isAfter(toDate(assaultIncident.reportTime), subMonths(new Date(), RECENT_ASSAULT_MONTHS)),
    )
  const countOfSeriousAssaults = nonDuplicateRecentAssaultIncidents.filter(assaultIncident =>
    assaultIncident.responses.find(
      response => SERIOUS_ASSAULT_QUESTIONS.includes(response.question) && response.answer === QUESTION_ANSWER_YES,
    ),
  ).length
  return {
    countOfSeriousAssaults,
    countOfAssaults: nonDuplicateRecentAssaultIncidents.length,
    countOfNonSeriousAssaults: nonDuplicateRecentAssaultIncidents.length - countOfSeriousAssaults,
  }
}
