import { PrisonerAllocationDto } from './prisonerAllocation.dto'
import makeTestAllocatedPomDto from './allocatedPom.dto.test-factory'

const makeTestPrisonerAllocationDto = (
  prisonerAllocationDto: Partial<PrisonerAllocationDto> = {},
): PrisonerAllocationDto => ({
  primary_pom: prisonerAllocationDto.primary_pom ?? makeTestAllocatedPomDto(),
  secondary_pom: prisonerAllocationDto.secondary_pom ?? makeTestAllocatedPomDto(),
})

export default makeTestPrisonerAllocationDto
