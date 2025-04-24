import { PrisonerSearchAlertDto } from './alert/prisonerSearchAlert.dto'
import { PrisonerSearchIncentiveLevelDto } from './incentiveLevel/prisonerSearchIncentiveLevel.dto'

export const LEGAL_STATUS_REMAND = 'REMAND'

export type LegalStatus =
  | 'RECALL'
  | 'DEAD'
  | 'INDETERMINATE_SENTENCE'
  | 'SENTENCED'
  | 'CONVICTED_UNSENTENCED'
  | 'CIVIL_PRISONER'
  | 'IMMIGRATION_DETAINEE'
  | typeof LEGAL_STATUS_REMAND
  | 'UNKNOWN'
  | 'OTHER'

export interface PrisonerSearchDto {
  bookingId: number
  releaseDate: string | undefined
  sentenceStartDate: string
  status: string
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive: PrisonerSearchIncentiveLevelDto | undefined
  legalStatus: LegalStatus
  recall: boolean | undefined
}
