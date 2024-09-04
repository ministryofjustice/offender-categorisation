import { PrisonerSearchAlertDto } from '../../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import { PrisonerSearchIncentiveLevelDto } from '../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'

export interface RecategorisationPrisonerSearchDto {
  releaseDate: string | undefined
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive: PrisonerSearchIncentiveLevelDto | undefined
}
