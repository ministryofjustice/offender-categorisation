import { PrisonerSearchAlertDto } from './alert/prisonerSearchAlert.dto'
import { PrisonerSearchIncentiveLevelDto } from './incentiveLevel/prisonerSearchIncentiveLevel.dto'

export interface PrisonerSearchDto {
  bookingId: number
  releaseDate: string | undefined
  sentenceStartDate: string
  status: string
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive: PrisonerSearchIncentiveLevelDto | undefined
}
