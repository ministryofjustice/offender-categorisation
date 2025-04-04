import { Caseload, CASELOAD } from './caseload'
import { STAFF_MEMBER, StaffMember } from './staffMember'
import { ROLE } from '../support/role'

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
  roles: string[],
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

export const CATEGORISER_USER = createUserAccount(
  'CATEGORISER_USER',
  STAFF_MEMBER.SM_2,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.BXI, CASELOAD.LEI, CASELOAD.MDI, CASELOAD.SYI, CASELOAD.WAI],
  [ROLE.ROLE_CREATE_CATEGORISATION],
)
export const ITAG_USER_COLLEAGUE = createUserAccount(
  'CATEGORISER_USER',
  STAFF_MEMBER.SM_3,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.BXI, CASELOAD.LEI, CASELOAD.MDI, CASELOAD.SYI, CASELOAD.WAI],
  [ROLE.ROLE_CREATE_CATEGORISATION],
)
export const RECATEGORISER_USER = createUserAccount(
  'RECATEGORISER_USER',
  STAFF_MEMBER.SM_6,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.BXI, CASELOAD.LEI, CASELOAD.MDI, CASELOAD.SYI, CASELOAD.WAI],
  [ROLE.ROLE_CREATE_RECATEGORISATION],
)
export const RECATEGORISER_USER_PNI = createUserAccount(
  'RECATEGORISER_USER',
  STAFF_MEMBER.SM_6,
  UserType.GENERAL,
  CASELOAD.PNI,
  [CASELOAD.PNI],
  [ROLE.ROLE_CREATE_RECATEGORISATION],
)
export const SUPERVISOR_USER = createUserAccount(
  'SUPERVISOR_USER',
  STAFF_MEMBER.SM_4,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.LEI, CASELOAD.BXI, CASELOAD.LEI, CASELOAD.MDI, CASELOAD.SYI, CASELOAD.WAI],
  [ROLE.ROLE_APPROVE_CATEGORISATION],
)
export const WOMEN_SUPERVISOR_USER = createUserAccount(
  'WOMEN_SUPERVISOR_USER',
  STAFF_MEMBER.SM_12,
  UserType.GENERAL,
  CASELOAD.PFI,
  [CASELOAD.PFI, CASELOAD.LNI, CASELOAD.AGI],
  [ROLE.ROLE_APPROVE_CATEGORISATION],
)
export const SECURITY_USER = createUserAccount(
  'SECURITY_USER',
  STAFF_MEMBER.SM_5,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.LEI],
  [ROLE.ROLE_CATEGORISATION_SECURITY],
)
export const FEMALE_SECURITY_USER = createUserAccount(
  'FEMALE_SECURITY_USER',
  STAFF_MEMBER.SM_14,
  UserType.GENERAL,
  CASELOAD.PFI,
  [CASELOAD.PFI, CASELOAD.LNI, CASELOAD.AGI],
  [ROLE.ROLE_CATEGORISATION_SECURITY],
)
export const READONLY_USER = createUserAccount(
  'READONLY_USER',
  STAFF_MEMBER.SM_5,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.LEI],
  [],
)
export const MULTIROLE_USER = createUserAccount(
  'MULTIROLE_USER',
  STAFF_MEMBER.SM_5,
  UserType.GENERAL,
  CASELOAD.LEI,
  [CASELOAD.LEI],
  [ROLE.ROLE_APPROVE_CATEGORISATION, ROLE.ROLE_CREATE_CATEGORISATION],
)
export const FEMALE_USER = createUserAccount(
  'FEMALE_USER',
  STAFF_MEMBER.SM_11,
  UserType.GENERAL,
  CASELOAD.PFI,
  [CASELOAD.PFI, CASELOAD.LNI, CASELOAD.AGI],
  [ROLE.ROLE_CREATE_CATEGORISATION],
)
export const FEMALE_RECAT_USER = createUserAccount(
  'FEMALE_RECAT_USER',
  STAFF_MEMBER.SM_13,
  UserType.GENERAL,
  CASELOAD.PFI,
  [CASELOAD.PFI, CASELOAD.LNI, CASELOAD.AGI],
  [ROLE.ROLE_CREATE_RECATEGORISATION],
)
