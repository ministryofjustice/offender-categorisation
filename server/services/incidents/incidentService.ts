import { IncidentReportingApiClient } from '../../data/incidentReportingApi/incidentReportingApiClient'
import {
  IncidentReport,
  QUESTION_ANSWER_YES,
  SERIOUS_ASSAULT_QUESTIONS,
} from '../../data/incidentReportingApi/incidentReport.dto'
import { CountOfAssaultIncidents } from './countOfAssaultIncidents'

const RECENT_ASSAULT_MONTHS = 12

export const getCountOfRecentAssaultsAndSeriousAssaults = async (
  incidentReportingApiClient: IncidentReportingApiClient,
  prisonerNumber: string,
): Promise<CountOfAssaultIncidents> => {
  const countOfAssaults = await incidentReportingApiClient.getTotalNumberOfIncidents(prisonerNumber)

  if (countOfAssaults === 0) {
    return {
      countOfAssaults: 0,
      countOfRecentSeriousAssaults: 0,
      countOfRecentNonSeriousAssaults: 0,
    }
  }

  const recentIncidentIds = await incidentReportingApiClient.getIncidentIds(
    prisonerNumber,
    RECENT_ASSAULT_MONTHS,
    countOfAssaults,
  )
  const recentIncidents = await Promise.all(
    recentIncidentIds.map(id => incidentReportingApiClient.getDetailedIncidentReport(id)),
  )

  const countOfRecentSeriousAssaults = recentIncidents.filter(isSeriousAssault).length

  return {
    countOfAssaults,
    countOfRecentSeriousAssaults,
    countOfRecentNonSeriousAssaults: recentIncidents.length - countOfRecentSeriousAssaults,
  }
}

const isSeriousAssault = (incident: IncidentReport): boolean =>
  incident.questions.some(
    question =>
      SERIOUS_ASSAULT_QUESTIONS.includes(question.question.toUpperCase()) &&
      question.responses.some(response => response.response.toUpperCase() === QUESTION_ANSWER_YES),
  )
