import { AllocatedPomDto } from './allocatedPom.dto'

const makeTestAllocatedPomDto = (allocatedPomDto: Partial<AllocatedPomDto> = {}): AllocatedPomDto => ({
  staff_id: allocatedPomDto.staff_id ?? 123,
  name: allocatedPomDto.name ?? 'Joe Bloggs',
})

export default makeTestAllocatedPomDto
