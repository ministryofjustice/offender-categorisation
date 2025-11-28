import { AlertDto } from './alertDto'

export const makeTestEscapeAlertDto = (escapeAlertDto: Partial<AlertDto> = {}): AlertDto => ({
  content: [
    {
      alertCode: {
        code: escapeAlertDto.content?.[0]?.alertCode?.code ?? 'XER',
      },
      activeFrom: escapeAlertDto.content?.[0]?.activeFrom ?? '12/02/2022',
    },
  ],
})
