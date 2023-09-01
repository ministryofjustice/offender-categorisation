export interface AgencyLocation {
  id: string
  description: string
  type: string
  active: boolean
}

export function agencyLocationFactory(id: string, description: string, type: string, active: boolean): AgencyLocation {
  return {
    id,
    description,
    type,
    active,
  }
}

export const AGENCY_LOCATION = {
  BXI: agencyLocationFactory('BXI', 'BRIXTON', 'INST', true),
  BMI: agencyLocationFactory('BMI', 'BIRMINGHAM', 'INST', true),
  LEI: agencyLocationFactory('LEI', 'LEEDS', 'INST', true),
  WAI: agencyLocationFactory('WAI', 'THE WEARE', 'INST', true),
  OUT: agencyLocationFactory('OUT', 'OUTSIDE', 'INST', true),
  TRN: agencyLocationFactory('TRN', 'TRANSFER', 'INST', true),
  MUL: agencyLocationFactory('MUL', 'MUL', 'INST', true),
  ZZGHI: agencyLocationFactory('ZZGHI', 'GHOST', 'INST', false),
  COURT1: agencyLocationFactory('COURT1', 'Court 1', 'CRT', true),
  ABDRCT: agencyLocationFactory('ABDRCT', 'Court 2', 'CRT', true),
  TRO: agencyLocationFactory('TRO', 'TROOM', 'INST', true),
  MDI: agencyLocationFactory('MDI', 'MOORLAND', 'INST', true),
  SYI: agencyLocationFactory('SYI', 'SHREWSBURY', 'INST', true),
  LNI: agencyLocationFactory('LNI', 'LOW NEWTON (HMP)', 'INST', true),
}
