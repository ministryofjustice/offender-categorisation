import { INCENTIVE_LEVEL_STANDARD, PrisonerSearchIncentiveLevelDto } from './prisonerSearchIncentiveLevel.dto'

const makeTestPrisonerSearchIncentiveLevelDto = (
  prisonerSearchIncentiveLevelDto: Partial<PrisonerSearchIncentiveLevelDto> = {},
): PrisonerSearchIncentiveLevelDto => ({
  level: {
    code: prisonerSearchIncentiveLevelDto.level.code ?? INCENTIVE_LEVEL_STANDARD,
    description: prisonerSearchIncentiveLevelDto.level.description ?? 'Incentive level standard',
  },
  dateTime: prisonerSearchIncentiveLevelDto.dateTime ?? '2024-01-01',
  nextReviewDate: prisonerSearchIncentiveLevelDto.nextReviewDate ?? '2024-06-01',
})

export default makeTestPrisonerSearchIncentiveLevelDto
