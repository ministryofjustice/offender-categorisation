import { ViperDto } from './viper.dto'

export const makeTestViperDto = (viperDto: Partial<ViperDto> = {}): ViperDto => ({
  aboveThreshold: viperDto.aboveThreshold ?? true,
  score: viperDto.score ?? 3,
})
