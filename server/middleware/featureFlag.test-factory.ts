import { FeatureFlagDto } from './featureFlag.dto'
import config from '../config'

export const makeTestFeatureFlagDto = (featureFlagDto: Partial<FeatureFlagDto> = {}): FeatureFlagDto => ({
  show_recategorisation_prioritisation_filter: featureFlagDto.show_recategorisation_prioritisation_filter ?? false,
  recategorisationPrioritisationEnabledPrisons: featureFlagDto.recategorisationPrioritisationEnabledPrisons ?? [
    config.featureFlags.recategorisationPrioritisation,
  ],
  si607EnabledPrisons: featureFlagDto.si607EnabledPrisons ?? [config.featureFlags.si607],
})

export default makeTestFeatureFlagDto
