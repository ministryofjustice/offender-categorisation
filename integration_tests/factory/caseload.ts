import { CaseloadType } from './caseloadType'

export const caseloadFactory = (id: string, description: string, type: CaseloadType, locations: string[]): Caseload => {
  return {
    id,
    description,
    type,
    locations: [...locations],
  }
}

export interface Caseload {
  id: string
  description: string
  type: CaseloadType
  locations: string[]
}
