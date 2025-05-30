import { CaseloadType } from './caseloadType'
import { AGENCY_LOCATION, AgencyLocation } from './agencyLocation'

export const caseloadFactory = (
  id: string,
  description: string,
  type: CaseloadType,
  locations: AgencyLocation[],
): Caseload => {
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
  locations: AgencyLocation[]
}

export const CASELOAD = {
  CADM_I: caseloadFactory('CADM_I', 'Central Administration Caseload for HMPS', CaseloadType.INST, []),
  HBI: caseloadFactory('HBI', 'HOLLESLEY BAY (HMP)', CaseloadType.INST, []),
  HHI: caseloadFactory('HHI', 'HOLME HOUSE (HMP)', CaseloadType.INST, []),
  HCI: caseloadFactory('HCI', 'HUNTERCOMBE (HMPYOI)', CaseloadType.INST, []),
  KMI: caseloadFactory('KMI', 'KIRKHAM (HMP)', CaseloadType.INST, []),
  LAI: caseloadFactory('LAI', 'LANCASTER CASTLE (HMP)', CaseloadType.INST, []),
  LFI: caseloadFactory('LFI', 'LANCASTER FARMS (HMPYOI)', CaseloadType.INST, []),
  LEI: caseloadFactory('LEI', 'LEEDS (HMP)', CaseloadType.INST, [AGENCY_LOCATION.LEI]),
  LWI: caseloadFactory('LWI', 'LEWES (HMP)', CaseloadType.INST, []),
  LII: caseloadFactory('LII', 'LINCOLN (HMP)', CaseloadType.INST, []),
  LHI: caseloadFactory('LHI', 'LINDHOLME (HMP)', CaseloadType.INST, []),
  LPI: caseloadFactory('LPI', 'LIVERPOOL (HMP)', CaseloadType.INST, []),
  LNI: caseloadFactory('LNI', 'LOW NEWTON (HMP)', CaseloadType.INST, []),
  MSI: caseloadFactory('MSI', 'MAIDSTONE (HMP)', CaseloadType.INST, []),
  MDI: caseloadFactory('MDI', 'MOORLAND CLOSED (HMP & YOI)', CaseloadType.INST, [AGENCY_LOCATION.MDI]),
  HDI: caseloadFactory('HDI', 'HATFIELD (HMP & YOI)', CaseloadType.INST, []),
  MHI: caseloadFactory('MHI', 'MORTON HALL IMMIGRATION REMOVAL CENTRE', CaseloadType.INST, []),
  NSI: caseloadFactory('NSI', 'NORTH SEA CAMP (HMP)', CaseloadType.INST, []),
  NNI: caseloadFactory('NNI', 'NORTHALLERTON (HMP)', CaseloadType.INST, []),
  NWI: caseloadFactory('NWI', 'NORWICH (HMP & YOI)', CaseloadType.INST, []),
  NMI: caseloadFactory('NMI', 'NOTTINGHAM (HMP)', CaseloadType.INST, []),
  PRI: caseloadFactory('PRI', 'PARC (HMP)', CaseloadType.INST, []),
  PVI: caseloadFactory('PVI', 'PENTONVILLE (HMP)', CaseloadType.INST, []),
  UPI: caseloadFactory('UPI', 'PRESCOED (HMP & YOI)', CaseloadType.INST, []),
  RNI: caseloadFactory('RNI', 'RANBY (HMP)', CaseloadType.INST, []),
  RSI: caseloadFactory('RSI', 'RISLEY (HMP)', CaseloadType.INST, []),
  RCI: caseloadFactory('RCI', 'ROCHESTER (HMP & YOI)', CaseloadType.INST, []),
  SDI: caseloadFactory('SDI', 'SEND (HMP)', CaseloadType.INST, []),
  SYI: caseloadFactory('SYI', 'SHREWSBURY (HMP)', CaseloadType.INST, [AGENCY_LOCATION.SYI]),
  EHI: caseloadFactory('EHI', 'STANDFORD HILL (HMP)', CaseloadType.INST, []),
  SHI: caseloadFactory('SHI', 'STOKE HEATH (HMPYOI)', CaseloadType.INST, []),
  SUI: caseloadFactory('SUI', 'SUDBURY (HMP)', CaseloadType.INST, []),
  SLI: caseloadFactory('SLI', 'SWALESIDE (HMP)', CaseloadType.INST, []),
  SNI: caseloadFactory('SNI', 'SWINFEN HALL (HMP)', CaseloadType.INST, []),
  VEI: caseloadFactory('VEI', 'THE VERNE (HMP)', CaseloadType.INST, []),
  TCI: caseloadFactory('TCI', 'THORN CROSS (HMPYOI)', CaseloadType.INST, []),
  WII: caseloadFactory('WII', 'WARREN HILL (HMP & YOI)', CaseloadType.INST, []),
  WEI: caseloadFactory('WEI', 'WEALSTUN (HMP)', CaseloadType.INST, []),
  WNI: caseloadFactory('WNI', 'WERRINGTON (HMPYOI)', CaseloadType.INST, []),
  WYI: caseloadFactory('WYI', 'WETHERBY (HMPYOI)', CaseloadType.INST, []),
  WRI: caseloadFactory('WRI', 'WHITEMOOR (HMP)', CaseloadType.INST, []),
  WOI: caseloadFactory('WOI', 'WOLDS (HMP)', CaseloadType.INST, []),
  WSI: caseloadFactory('WSI', 'WORMWOOD SCRUBS (HMP)', CaseloadType.INST, []),
  TRN: caseloadFactory('TRN', 'TRANSFER', CaseloadType.INST, []),
  BHI: caseloadFactory('BHI', 'BLANTYRE HOUSE (HMP)', CaseloadType.INST, []),
  BSI: caseloadFactory('BSI', 'BRINSFORD (HMP)', CaseloadType.INST, []),
  BXI: caseloadFactory('BXI', 'BRIXTON (HMP)', CaseloadType.INST, [AGENCY_LOCATION.BXI]),
  BZI: caseloadFactory('BZI', 'BRONZEFIELD (HMP)', CaseloadType.INST, []),
  BNI: caseloadFactory('BNI', 'BULLINGDON (HMP)', CaseloadType.INST, []),
  CHI: caseloadFactory('CHI', 'CAMP HILL (HMP)', CaseloadType.INST, []),
  CSI: caseloadFactory('CSI', 'CASTINGTON (HMP & YOI)', CaseloadType.INST, []),
  CDI: caseloadFactory('CDI', 'CHELMSFORD (HMP)', CaseloadType.INST, []),
  CKI: caseloadFactory('CKI', 'COOKHAM WOOD (HMP)', CaseloadType.INST, []),
  DRI: caseloadFactory('DRI', 'DORCHESTER (HMP)', CaseloadType.INST, []),
  DVI: caseloadFactory('DVI', 'Dover Immigration Removal Centre', CaseloadType.INST, []),
  EYI: caseloadFactory('EYI', 'ELMLEY (HMP)', CaseloadType.INST, []),
  EVI: caseloadFactory('EVI', 'EVERTHORPE (HMP)', CaseloadType.INST, []),
  FSI: caseloadFactory('FSI', 'FEATHERSTONE (HMP)', CaseloadType.INST, []),
  FDI: caseloadFactory('FDI', 'FORD (HMP)', CaseloadType.INST, []),
  FHI: caseloadFactory('FHI', 'FOSTON HALL (HMP)', CaseloadType.INST, []),
  FNI: caseloadFactory('FNI', 'FULL SUTTON (HMP)', CaseloadType.INST, []),
  GPI: caseloadFactory('GPI', 'GLEN PARVA (HMPYOI & RC)', CaseloadType.INST, []),
  GNI: caseloadFactory('GNI', 'GRENDON/SPRING HILL (HMP)', CaseloadType.INST, []),
  HRI: caseloadFactory('HRI', 'Haslar Immigration Removal Centre', CaseloadType.INST, []),
  HOI: caseloadFactory('HOI', 'HIGH DOWN (HMP)', CaseloadType.INST, []),
  HII: caseloadFactory('HII', 'HINDLEY (HMP & YOI)', CaseloadType.INST, []),
  HYI: caseloadFactory('HYI', 'HOLLOWAY (HMP)', CaseloadType.INST, []),
  HLI: caseloadFactory('HLI', 'HULL (HMP)', CaseloadType.INST, []),
  PTI: caseloadFactory('PTI', 'KINGSTON (HMP)', CaseloadType.INST, []),
  KVI: caseloadFactory('KVI', 'KIRKLEVINGTON GRANGE (HMP)', CaseloadType.INST, []),
  LMI: caseloadFactory('LMI', 'LATCHMERE HOUSE (HMP)', CaseloadType.INST, []),
  LCI: caseloadFactory('LCI', 'LEICESTER (HMP)', CaseloadType.INST, []),
  LYI: caseloadFactory('LYI', 'LEYHILL (HMP)', CaseloadType.INST, []),
  LTI: caseloadFactory('LTI', 'LITTLEHEY (HMP)', CaseloadType.INST, []),
  LLI: caseloadFactory('LLI', 'LONG LARTIN (HMP)', CaseloadType.INST, []),
  LGI: caseloadFactory('LGI', 'LOWDHAM GRANGE (HMP)', CaseloadType.INST, []),
  MRI: caseloadFactory('MRI', 'MANCHESTER (HMP)', CaseloadType.INST, []),
  ONI: caseloadFactory('ONI', 'ONLEY (HMP & YOI)', CaseloadType.INST, []),
  PDI: caseloadFactory('PDI', 'PORTLAND (HMPYOI)', CaseloadType.INST, []),
  PNI: caseloadFactory('PNI', 'PRESTON (HMP)', CaseloadType.INST, []),
  RDI: caseloadFactory('RDI', 'READING (HMP & YOI)', CaseloadType.INST, []),
  RHI: caseloadFactory('RHI', 'RYE HILL (HMP)', CaseloadType.INST, []),
  SMI: caseloadFactory('SMI', 'SHEPTON MALLET (HMP)', CaseloadType.INST, []),
  SFI: caseloadFactory('SFI', 'STAFFORD (HMP)', CaseloadType.INST, []),
  SKI: caseloadFactory('SKI', 'STOCKEN (HMP)', CaseloadType.INST, []),
  STI: caseloadFactory('STI', 'STYAL (HMP & YOI)', CaseloadType.INST, []),
  SWI: caseloadFactory('SWI', 'SWANSEA (HMP)', CaseloadType.INST, []),
  MTI: caseloadFactory('MTI', 'THE MOUNT (HMP)', CaseloadType.INST, []),
  WAI: caseloadFactory('WAI', 'THE WEARE (HMP)', CaseloadType.INST, [AGENCY_LOCATION.WAI]),
  UKI: caseloadFactory('UKI', 'USK (HMP)', CaseloadType.INST, []),
  WWI: caseloadFactory('WWI', 'WANDSWORTH (HMP)', CaseloadType.INST, []),
  WLI: caseloadFactory('WLI', 'WAYLAND (HMP)', CaseloadType.INST, []),
  WBI: caseloadFactory('WBI', 'WELLINGBOROUGH (HMP)', CaseloadType.INST, []),
  WTI: caseloadFactory('WTI', 'WHATTON (HMP)', CaseloadType.INST, []),
  WCI: caseloadFactory('WCI', 'WINCHESTER (HMP)', CaseloadType.INST, []),
  WHI: caseloadFactory('WHI', 'WOODHILL (HMP)', CaseloadType.INST, []),
  WMI: caseloadFactory('WMI', 'WYMOTT (HMP)', CaseloadType.INST, []),
  ZZGHI: caseloadFactory('ZZGHI', 'GHOST HOLDING ESTABLISHMENT', CaseloadType.INST, [AGENCY_LOCATION.WAI]),
  SPI: caseloadFactory('SPI', 'SPRING HILL (HMP)', CaseloadType.INST, []),
  PBI: caseloadFactory('PBI', 'PETERBOROUGH (HMP)', CaseloadType.INST, []),
  KTI: caseloadFactory('KTI', 'KENNET (HMP)', CaseloadType.INST, []),
  LIC: caseloadFactory('LIC', 'LICENCE CHANGES FOR INACTIVE OFFENDERS', CaseloadType.INST, []),
  HEI: caseloadFactory('HEI', 'HEWELL (HMP)', CaseloadType.INST, []),
  HQGRP: caseloadFactory('HQGRP', 'DO NOT USE', CaseloadType.INST, []),
  ISI: caseloadFactory('ISI', 'ISIS HMP/YOI', CaseloadType.INST, []),
  PFI: caseloadFactory('PFI', 'PETERBOROUGH FEMALE HMP', CaseloadType.INST, []),
  GTI: caseloadFactory('GTI', 'GARTREE (HMP)', CaseloadType.INST, []),
  WDI: caseloadFactory('WDI', 'WAKEFIELD (HMP)', CaseloadType.INST, []),
  PKI: caseloadFactory('PKI', 'PARKHURST (HMP)', CaseloadType.INST, []),
  NHI: caseloadFactory('NHI', 'NEW HALL (HMP)', CaseloadType.INST, []),
  DTI: caseloadFactory('DTI', 'DEERBOLT (HMPYOI)', CaseloadType.INST, []),
  BRI: caseloadFactory('BRI', 'BURE (HMP)', CaseloadType.INST, []),
  ADMINC: caseloadFactory('ADMINC', 'REF- COMMUNITY ADMIN CASELOAD', CaseloadType.COMMUNITY, []),
  ADMINI: caseloadFactory('ADMINI', 'REF- INSTITUTIONAL ADMIN CASELOAD', CaseloadType.INST, []),
  ALI: caseloadFactory('ALI', 'ALBANY (HMP)', CaseloadType.INST, []),
  AKI: caseloadFactory('AKI', 'ACKLINGTON (HMP)', CaseloadType.INST, []),
  ACI: caseloadFactory('ACI', 'ALTCOURSE (HMP)', CaseloadType.INST, []),
  ASI: caseloadFactory('ASI', 'ASHFIELD (HMP)', CaseloadType.INST, []),
  AWI: caseloadFactory('AWI', 'ASHWELL (HMP)', CaseloadType.INST, []),
  AGI: caseloadFactory('AGI', 'ASKHAM GRANGE (HMP & YOI)', CaseloadType.INST, []),
  AYI: caseloadFactory('AYI', 'AYLESBURY (HMP)', CaseloadType.INST, []),
  BFI: caseloadFactory('BFI', 'BEDFORD (HMP)', CaseloadType.INST, []),
  BAI: caseloadFactory('BAI', 'BELMARSH (HMP)', CaseloadType.INST, []),
  BMI: caseloadFactory('BMI', 'BIRMINGHAM (HMP)', CaseloadType.INST, []),
  BTI: caseloadFactory('BTI', 'BLAKENHURST (HMP)', CaseloadType.INST, []),
  BDI: caseloadFactory('BDI', 'BLUNDESTON (HMP)', CaseloadType.INST, []),
  BLI: caseloadFactory('BLI', 'BRISTOL (HMP)', CaseloadType.INST, []),
  BKI: caseloadFactory('BKI', 'BROCKHILL (HMP & YOI)', CaseloadType.INST, []),
  BCI: caseloadFactory('BCI', 'BUCKLEY HALL (HMP)', CaseloadType.INST, []),
  BUI: caseloadFactory('BUI', 'BULLWOOD HALL (HMP & YOI)', CaseloadType.INST, []),
  CYI: caseloadFactory('CYI', 'CANTERBURY (HMP)', CaseloadType.INST, []),
  CFI: caseloadFactory('CFI', 'CARDIFF (HMP)', CaseloadType.INST, []),
  CWI: caseloadFactory('CWI', 'CHANNINGS WOOD (HMP)', CaseloadType.INST, []),
  CLI: caseloadFactory('CLI', 'COLDINGLEY (HMP)', CaseloadType.INST, []),
  DAI: caseloadFactory('DAI', 'DARTMOOR (HMP)', CaseloadType.INST, []),
  DNI: caseloadFactory('DNI', 'DONCASTER (HMP)', CaseloadType.INST, []),
  DGI: caseloadFactory('DGI', 'DOVEGATE (HMP)', CaseloadType.INST, []),
  DWI: caseloadFactory('DWI', 'DOWNVIEW (HMP)', CaseloadType.INST, []),
  DHI: caseloadFactory('DHI', 'DRAKE HALL (HMP & YOI)', CaseloadType.INST, []),
  DMI: caseloadFactory('DMI', 'DURHAM (HMP)', CaseloadType.INST, []),
  ESI: caseloadFactory('ESI', 'EAST SUTTON PARK (HMP & YOI)', CaseloadType.INST, []),
  EWI: caseloadFactory('EWI', 'EASTWOOD PARK (HMP)', CaseloadType.INST, []),
  NEI: caseloadFactory('NEI', 'EDMUNDS HILL (HMP)', CaseloadType.INST, []),
  EEI: caseloadFactory('EEI', 'ERLESTOKE (HMP)', CaseloadType.INST, []),
  EXI: caseloadFactory('EXI', 'EXETER (HMP)', CaseloadType.INST, []),
  FMI: caseloadFactory('FMI', 'FELTHAM (HMP & YOI)', CaseloadType.INST, []),
  FBI: caseloadFactory('FBI', 'FOREST BANK (HMP & YOI)', CaseloadType.INST, []),
  FKI: caseloadFactory('FKI', 'FRANKLAND (HMP)', CaseloadType.INST, []),
  GHI: caseloadFactory('GHI', 'GARTH (HMP)', CaseloadType.INST, []),
  GLI: caseloadFactory('GLI', 'GLOUCESTER (HMP)', CaseloadType.INST, []),
  GMI: caseloadFactory('GMI', 'GUYS MARSH (HMP)', CaseloadType.INST, []),
  HVI: caseloadFactory('HVI', 'HAVERIGG (HMP)', CaseloadType.INST, []),
  HGI: caseloadFactory('HGI', 'HEWELL GRANGE (HMP)', CaseloadType.INST, []),
  HPI: caseloadFactory('HPI', 'HIGHPOINT (HMP)', CaseloadType.INST, []),
  HMI: caseloadFactory('HMI', 'HUMBER (HMP)', CaseloadType.INST, []),
  NLI: caseloadFactory('NLI', 'NORTHUMBERLAND (HMP)', CaseloadType.INST, []),
  OWI: caseloadFactory('OWI', 'OAKWOOD (HMP)', CaseloadType.INST, []),
  TSI: caseloadFactory('TSI', 'THAMESIDE (HMP)', CaseloadType.INST, []),
  MUL: caseloadFactory('MUL', 'MUL Prison', CaseloadType.INST, [AGENCY_LOCATION.BXI, AGENCY_LOCATION.LEI]),
  NWEB: caseloadFactory('NWEB', 'Nomis-Web Application', CaseloadType.APP, []),
}
