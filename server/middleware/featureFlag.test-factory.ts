import { FeatureFlagDto } from './featureFlag.dto'
import config from '../config'

export const makeTestFeatureFlagDto = (featureFlagDto: Partial<FeatureFlagDto> = {}): FeatureFlagDto => ({
  three_to_five_policy_change:
    featureFlagDto.three_to_five_policy_change ?? config.featureFlags.three_to_five_policy_change,
})

export default makeTestFeatureFlagDto
