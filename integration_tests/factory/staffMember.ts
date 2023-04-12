import { Caseload, CaseloadType } from './caseload'

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
  active: boolean
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
