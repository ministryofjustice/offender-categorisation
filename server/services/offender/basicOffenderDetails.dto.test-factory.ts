import { BasicOffenderDetailsDto } from './basicOffenderDetails.dto'

export const makeTestBasicOffenderDetailsDto = (
  basicOffenderDetailsDto: Partial<BasicOffenderDetailsDto>
): BasicOffenderDetailsDto => ({
  agencyId: basicOffenderDetailsDto.agencyId,
})

export default makeTestBasicOffenderDetailsDto
