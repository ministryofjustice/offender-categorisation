import { PrisonerSearchAlertDto } from '../../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import { PrisonerSearchIncentiveLevelDto } from '../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'
import type { PrisonerSearchDto } from '../../data/prisonerSearch/prisonerSearch.dto'

export interface RecategorisationPrisonerSearchDto {
  releaseDate: string | undefined
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive: PrisonerSearchIncentiveLevelDto | undefined
  legalStatus: PrisonerSearchDto['legalStatus']
}

export const mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto = (
  prisonerSearchDto: PrisonerSearchDto
): RecategorisationPrisonerSearchDto => ({
  releaseDate: prisonerSearchDto.releaseDate,
  alerts: prisonerSearchDto.alerts,
  currentIncentive: prisonerSearchDto.currentIncentive,
  legalStatus: prisonerSearchDto.legalStatus,
})
