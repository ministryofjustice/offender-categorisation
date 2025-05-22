import { PrisonerSearchAlertDto } from '../../../data/prisonerSearch/alert/prisonerSearchAlert.dto'
import { PrisonerSearchIncentiveLevelDto } from '../../../data/prisonerSearch/incentiveLevel/prisonerSearchIncentiveLevel.dto'
import type { LegalStatus, PrisonerSearchDto } from '../../../data/prisonerSearch/prisonerSearch.dto'

export interface RecategorisationPrisonerSearchDto {
  bookingId: number
  releaseDate: string | undefined
  alerts: PrisonerSearchAlertDto[] | undefined
  currentIncentive: PrisonerSearchIncentiveLevelDto | undefined
  legalStatus: LegalStatus
  sentenceStartDate: string | undefined
  recall: boolean | undefined
  postRecallReleaseDate: string | undefined
}

export const mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto = (
  prisonerSearchDto: PrisonerSearchDto,
): RecategorisationPrisonerSearchDto => ({
  bookingId: prisonerSearchDto.bookingId,
  releaseDate: prisonerSearchDto.releaseDate,
  alerts: prisonerSearchDto.alerts,
  currentIncentive: prisonerSearchDto.currentIncentive,
  legalStatus: prisonerSearchDto.legalStatus,
  sentenceStartDate: prisonerSearchDto.sentenceStartDate,
  recall: prisonerSearchDto.recall,
  postRecallReleaseDate: prisonerSearchDto.postRecallReleaseDate,
})
