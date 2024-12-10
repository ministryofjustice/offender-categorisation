import { FeatureFlagDto } from './featureFlag.dto'
import config from '../config'

export const makeTestFeatureFlagDto = (featureFlagDto: Partial<FeatureFlagDto> = {}): FeatureFlagDto => ({
  si607EnabledPrisons: featureFlagDto.si607EnabledPrisons ?? [config.featureFlags.si607],
})

export default makeTestFeatureFlagDto
