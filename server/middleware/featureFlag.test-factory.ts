import { FeatureFlagDto } from './featureFlag.dto'

export const makeTestFeatureFlagDto = (featureFlagDto: Partial<FeatureFlagDto> = {}): FeatureFlagDto => {
  return featureFlagDto
}

export default makeTestFeatureFlagDto
