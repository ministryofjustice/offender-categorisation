import { ProbationOffenderSearchOffenderDto } from './probationOffenderSearchOffender.dto'

export const makeTestProbationOffenderSearchOffenderDto = (
  probationOffenderSearchOffenderDto: Partial<ProbationOffenderSearchOffenderDto> = {},
): ProbationOffenderSearchOffenderDto => ({
  otherIds: {
    nomsNumber: probationOffenderSearchOffenderDto.otherIds?.nomsNumber ?? 'ABC123',
    crn: probationOffenderSearchOffenderDto.otherIds?.crn ?? 'DEF456',
  },
})

export default makeTestProbationOffenderSearchOffenderDto
