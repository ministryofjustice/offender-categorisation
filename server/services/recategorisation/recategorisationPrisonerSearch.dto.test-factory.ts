import { RecategorisationPrisonerSearchDto } from './recategorisationPrisonerSearch.dto'

const makeTestRecategorisationPrisonerSearchDto = (
  recategorisationPrisonerSearchDto: Partial<RecategorisationPrisonerSearchDto> = {}
): RecategorisationPrisonerSearchDto => ({
  releaseDate: recategorisationPrisonerSearchDto.releaseDate ?? undefined,
  alerts: recategorisationPrisonerSearchDto.alerts ?? undefined,
  currentIncentive: recategorisationPrisonerSearchDto.currentIncentive ?? undefined,
})

export default makeTestRecategorisationPrisonerSearchDto
