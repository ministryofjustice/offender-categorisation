import { RecategorisationPrisonerSearchDto } from './recategorisationPrisonerSearch.dto'

const makeTestRecategorisationPrisonerSearchDto = (
  recategorisationPrisonerSearchDto: Partial<RecategorisationPrisonerSearchDto> = {},
): RecategorisationPrisonerSearchDto => ({
  releaseDate: recategorisationPrisonerSearchDto.releaseDate ?? undefined,
  alerts: recategorisationPrisonerSearchDto.alerts ?? undefined,
  currentIncentive: recategorisationPrisonerSearchDto.currentIncentive ?? undefined,
  legalStatus: recategorisationPrisonerSearchDto.legalStatus ?? 'SENTENCED',
  sentenceStartDate: recategorisationPrisonerSearchDto.sentenceStartDate ?? '2025-01-01',
  recall: recategorisationPrisonerSearchDto.recall ?? false,
  dueDateForRecalls: recategorisationPrisonerSearchDto.dueDateForRecalls ?? undefined,
  postRecallReleaseDate: recategorisationPrisonerSearchDto.postRecallReleaseDate ?? '2025-01-01',
  lastDateInPrison: recategorisationPrisonerSearchDto.lastDateInPrison ?? '2025-01-01',
})

export default makeTestRecategorisationPrisonerSearchDto
