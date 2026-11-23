import { CaseloadDto } from './caseload.dto'

export interface UserCaseloadDto {
  username: string
  activeCaseload?: CaseloadDto
  caseloads: CaseloadDto[]
}
