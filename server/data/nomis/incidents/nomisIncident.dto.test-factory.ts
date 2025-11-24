import {
  INCIDENT_STATUS_DUPLICATE,
  NomisIncidentDto,
  NomisIncidentDtoResponse,
  QUESTION_ANSWER_YES,
  SERIOUS_ASSAULT_QUESTIONS,
} from './nomisIncident.dto'

export const makeTestNomisIncidentDto = (nomisIncidentDto: Partial<NomisIncidentDto> = {}) => ({
  incidentStatus: nomisIncidentDto.incidentStatus ?? INCIDENT_STATUS_DUPLICATE,
  reportTime: nomisIncidentDto.reportTime ?? '2025-01-01',
  responses: nomisIncidentDto.responses ?? [],
})

export const makeTestNomisIncidentDtoResponse = (
  nomisIncidentDtoResponse: Partial<NomisIncidentDtoResponse> = {},
): NomisIncidentDtoResponse => ({
  question: nomisIncidentDtoResponse.question ?? SERIOUS_ASSAULT_QUESTIONS[0],
  answer: QUESTION_ANSWER_YES,
})
