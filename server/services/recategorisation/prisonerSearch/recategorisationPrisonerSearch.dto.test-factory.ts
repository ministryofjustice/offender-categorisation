import { RecategorisationPrisonerSearchDto } from './recategorisationPrisonerSearch.dto'

const makeTestRecategorisationPrisonerSearchDto = (
  recategorisationPrisonerSearchDto: Partial<RecategorisationPrisonerSearchDto> = {},
): RecategorisationPrisonerSearchDto => ({
  bookingId: recategorisationPrisonerSearchDto.bookingId ?? 123,
  releaseDate: recategorisationPrisonerSearchDto.releaseDate ?? undefined,
  alerts: recategorisationPrisonerSearchDto.alerts ?? undefined,
  currentIncentive: recategorisationPrisonerSearchDto.currentIncentive ?? undefined,
  legalStatus: recategorisationPrisonerSearchDto.legalStatus ?? 'SENTENCED',
  sentenceStartDate: recategorisationPrisonerSearchDto.sentenceStartDate ?? '2025-01-01',
  recall: recategorisationPrisonerSearchDto.recall ?? false,
  postRecallReleaseDate: recategorisationPrisonerSearchDto.postRecallReleaseDate ?? '2025-01-01',
})

export default makeTestRecategorisationPrisonerSearchDto
