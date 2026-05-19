import {
  INCIDENT_TYPE_ASSAULT_5,
  IncidentReport,
  PrisonerInvolvement,
  Question,
  QUESTION_ANSWER_YES,
  ReportBasic,
  Response,
  SERIOUS_ASSAULT_QUESTIONS,
} from './incidentReport.dto'

export const makeTestIncidentReport = (report: Partial<IncidentReport> = {}): IncidentReport => ({
  id: report.id ?? '00000000-0000-0000-0000-000000000000',
  type: report.type ?? INCIDENT_TYPE_ASSAULT_5,
  status: report.status ?? 'CLOSED',
  questions: report.questions ?? [],
  prisonersInvolved: report.prisonersInvolved ?? [],
})

export const makeTestReportBasic = (report: Partial<ReportBasic> = {}): ReportBasic => ({
  id: report.id ?? '00000000-0000-0000-0000-000000000000',
})

export const makeTestQuestion = (question: Partial<Question> = {}): Question => ({
  code: question.code ?? 'CODE_1',
  question: question.question ?? SERIOUS_ASSAULT_QUESTIONS[0],
  responses: question.responses ?? [makeTestResponse()],
})

export const makeTestResponse = (response: Partial<Response> = {}): Response => ({
  code: response.code ?? 'RESPONSE_CODE_1',
  response: response.response ?? QUESTION_ANSWER_YES,
})

export const makeTestPrisonerInvolvement = (involvement: Partial<PrisonerInvolvement> = {}): PrisonerInvolvement => ({
  prisonerNumber: involvement.prisonerNumber ?? 'A1234BC',
  prisonerRole: involvement.prisonerRole ?? 'PERPETRATOR',
})
