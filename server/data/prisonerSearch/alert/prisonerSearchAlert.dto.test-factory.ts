import { ESCAPE_LIST_ALERT_CODE, PrisonerSearchAlertDto } from './prisonerSearchAlert.dto'

const makeTestPrisonerSearchAlertDto = (
  prisonerSearchAlertDto: Partial<PrisonerSearchAlertDto> = {},
): PrisonerSearchAlertDto => ({
  alertType: prisonerSearchAlertDto.alertType ?? 'H',
  alertCode: prisonerSearchAlertDto.alertCode ?? ESCAPE_LIST_ALERT_CODE,
  active: prisonerSearchAlertDto.active ?? true,
  expired: prisonerSearchAlertDto.expired ?? false,
})

export default makeTestPrisonerSearchAlertDto
