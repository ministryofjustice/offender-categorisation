import type { PrisonerSearchDto } from '../../data/prisonerSearch/prisonerSearch.dto'
import { RecategorisationPrisonerSearchDto } from './recategorisationPrisonerSearch.dto'

const mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto = (
  prisonerSearchDto: PrisonerSearchDto
): RecategorisationPrisonerSearchDto => ({
  releaseDate: prisonerSearchDto.releaseDate,
  alerts: prisonerSearchDto.alerts,
  currentIncentive: prisonerSearchDto.currentIncentive,
})

export default mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto
