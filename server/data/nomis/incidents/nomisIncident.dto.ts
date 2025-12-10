export const INCIDENT_TYPE_ASSAULT = 'ASSAULT'
export const INCIDENT_TYPE_ASSAULTS3 = 'ASSAULTS3'

export const PARTICIPATION_ROLE_ACTINV = 'ACTINV'
export const PARTICIPATION_ROLE_ASSIAL = 'ASSIAL'
export const PARTICIPATION_ROLE_FIGHT = 'FIGHT'
export const PARTICIPATION_ROLE_IMPED = 'IMPED'
export const PARTICIPATION_ROLE_PERP = 'PERP'
export const PARTICIPATION_ROLE_SUSASS = 'SUSASS'
export const PARTICIPATION_ROLE_SUSINV = 'SUSINV'

export const INCIDENT_STATUS_DUPLICATE = 'DUP'

export const SERIOUS_ASSAULT_QUESTIONS = [
  'WAS THIS A SEXUAL ASSAULT',
  'WAS MEDICAL TREATMENT FOR CONCUSSION OR INTERNAL INJURIES REQUIRED',
  'WAS A SERIOUS INJURY SUSTAINED',
  'DID INJURIES RESULT IN DETENTION IN OUTSIDE HOSPITAL AS AN IN-PATIENT',
]

export const QUESTION_ANSWER_YES = 'YES'

export interface NomisIncidentDto {
  incidentStatus: string
  reportTime: string
  responses: NomisIncidentDtoResponse[]
}

export interface NomisIncidentDtoResponse {
  question: string
  answer: string
}
