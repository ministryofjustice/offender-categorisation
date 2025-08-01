import { EscapeAlertDto } from './escapeAlert.dto'

export const makeTestEscapeAlertDto = (escapeAlertDto: Partial<EscapeAlertDto> = {}): EscapeAlertDto => ({
  content: [
    {
      alertCode: {
        code: escapeAlertDto.content?.[0]?.alertCode?.code ?? 'XER',
      },
      activeFrom: escapeAlertDto.content?.[0]?.activeFrom ?? '12/02/2022',
    },
  ],
})
