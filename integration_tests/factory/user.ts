import { CaseloadType } from './caseloadType'
import { caseloadFactory, Caseload } from './caseload'
import { staffMemberFactory, StaffMember } from './staffMember'

enum UserType {
  GENERAL,
  PFI,
}

export interface UserAccount {
  username: string
  staffMember: StaffMember
  type: UserType
  workingCaseload: Caseload
  caseloads: Caseload[]
  roles: string[]
}

function createUserAccount(
  username: string,
  staffMember: StaffMember,
  type: UserType,
  workingCaseload: Caseload,
  caseloads: Caseload[],
  roles: string[]
): UserAccount {
  return {
    username,
    staffMember,
    type,
    workingCaseload,
    caseloads,
    roles,
  }
}

export const leiCaseload = caseloadFactory('LEI', 'LEEDS (HMP)', CaseloadType.INST, ['LEI'])

export const SECURITY_USER = createUserAccount(
  'SECURITY_USER',
  staffMemberFactory(-5, leiCaseload, leiCaseload, 'User', 'Another', 'Test', true),
  UserType.GENERAL,
  leiCaseload,
  [leiCaseload],
  ['ROLE_CATEGORISATION_SECURITY']
)
