export const ESCAPE_RISK_ALERT_CODE = 'XER'
export const ESCAPE_LIST_ALERT_CODE = 'XEL'
export const ESCAPE_LIST_HEIGHTENED_ALERT_CODE = 'XELH'
export const TERRORIST_ACT_ALERT_CODE = 'XTACT'
export const RESTRICTED_ROTL_ALERT_CODE = 'RROTL'
export const ROTL_SUSPENSION_ALERT_CODE = 'ROTL'
export const NOT_FOR_RELEASE_ALERT_CODE = 'XNR'
export const OCGM_ALERT_CODE = 'DOCGM'

export interface PrisonerSearchAlertDto {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}
