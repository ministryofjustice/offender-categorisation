export const INCIDENT_TYPE_ASSAULT_1 = 'ASSAULT_1'
export const INCIDENT_TYPE_ASSAULT_5 = 'ASSAULT_5'

export const INVOLVING_PRISONER_ROLES = [
  'ACTIVE_INVOLVEMENT',
  'ASSAILANT',
  'FIGHTER',
  'IMPEDED_STAFF',
  'PERPETRATOR',
  'SUSPECTED_ASSAILANT',
  'SUSPECTED_INVOLVED',
]

export const INCIDENT_REPORT_STATUSES = [
  'AWAITING_REVIEW',
  'ON_HOLD',
  'NEEDS_UPDATING',
  'UPDATED',
  'CLOSED',
  'WAS_CLOSED',
]

export const SERIOUS_ASSAULT_QUESTIONS = [
  'WAS THIS A SEXUAL ASSAULT',
  'WAS MEDICAL TREATMENT FOR CONCUSSION OR INTERNAL INJURIES REQUIRED',
  'WAS A SERIOUS INJURY SUSTAINED',
  'DID INJURIES RESULT IN DETENTION IN OUTSIDE HOSPITAL AS AN IN-PATIENT',
]

export const QUESTION_ANSWER_YES = 'YES'

export interface IncidentReportResponse {
  content: ReportBasic[]
  totalElements: number
}

export interface ReportBasic {
  id: string
}

export interface IncidentReport extends ReportBasic {
  type: string
  status: string
  questions: Question[]
  prisonersInvolved: PrisonerInvolvement[]
}

export interface Question {
  code: string
  question: string
  responses: Response[]
}

export interface Response {
  code: string
  response: string
}

export interface PrisonerInvolvement {
  prisonerNumber: string
  prisonerRole: string
}
