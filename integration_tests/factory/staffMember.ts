import { CASELOAD, Caseload } from './caseload'

export interface StaffMember {
  id: number
  assignedCaseload: Caseload
  workingCaseload: Caseload
  lastName: string
  firstName: string
  middleName: string
  active: boolean
}

export const staffMemberFactory = (
  id: number,
  assignedCaseload: Caseload,
  workingCaseload: Caseload,
  lastName: string,
  firstName: string,
  middleName: string,
  active: boolean,
): StaffMember => {
  return {
    id,
    assignedCaseload,
    workingCaseload,
    lastName,
    firstName,
    middleName,
    active,
  }
}

export const STAFF_MEMBER = {
  SM_1: staffMemberFactory(-1, CASELOAD.NWEB, CASELOAD.NWEB, 'User', 'Elite2', 'API', true),
  SM_2: staffMemberFactory(-2, CASELOAD.LEI, CASELOAD.LEI, 'User', 'API', 'ITAG', true),
  SM_3: staffMemberFactory(-3, CASELOAD.LEI, CASELOAD.LEI, 'User', 'HPA', null, true),
  SM_4: staffMemberFactory(-4, CASELOAD.MUL, CASELOAD.MUL, 'User', 'Test', null, true),
  SM_5: staffMemberFactory(-5, CASELOAD.LEI, CASELOAD.LEI, 'User', 'Another', 'Test', true),
  SM_6: staffMemberFactory(-6, CASELOAD.MDI, CASELOAD.MDI, 'Officer1', 'Wing', null, true),
  SM_7: staffMemberFactory(-7, CASELOAD.BXI, CASELOAD.BXI, 'Officer2', 'Wing', null, true),
  SM_8: staffMemberFactory(-8, CASELOAD.WAI, CASELOAD.WAI, 'Officer3', 'Wing', null, true),
  SM_9: staffMemberFactory(-9, CASELOAD.SYI, CASELOAD.SYI, 'Officer4', 'Wing', null, true),
  SM_10: staffMemberFactory(-10, CASELOAD.LEI, CASELOAD.LEI, 'Officer', 'Ex', null, false),
  SM_11: staffMemberFactory(-11, CASELOAD.PFI, CASELOAD.PFI, 'Officer5', 'Ex11', null, true),
  SM_12: staffMemberFactory(-12, CASELOAD.PFI, CASELOAD.PFI, 'Officer6', 'Ex12', null, true),
  SM_13: staffMemberFactory(-13, CASELOAD.PFI, CASELOAD.PFI, 'Officer7', 'Ex13', null, true),
  SM_14: staffMemberFactory(-14, CASELOAD.PFI, CASELOAD.PFI, 'Officer8', 'Ex14', null, true),
}
