import { FeatureFlagDto } from './featureFlag.dto'

export const makeTestFeatureFlagDto = (featureFlagDto: Partial<FeatureFlagDto> = {}): FeatureFlagDto => ({
  three_to_five_policy_change: featureFlagDto.three_to_five_policy_change ?? false,
})

export default makeTestFeatureFlagDto
