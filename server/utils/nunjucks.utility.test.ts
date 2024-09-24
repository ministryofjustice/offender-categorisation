import { removeFilterFromFullUrl } from './nunjucks.utility'
import {
  DUE_DATE,
  LOW_RISK_OF_ESCAPE,
  NOT_MARKED_AS_NOT_FOR_RELEASE,
  OVERDUE,
  POM,
  RecategorisationHomeFilterDueDateValue,
  RecategorisationHomeFilterPomValue, RecategorisationHomeFilters,
  RecategorisationHomeFilterSuitabilityForOpenConditionsValue,
  REVIEWS_ASSIGNED_TO_ME,
  STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
  SUITABILIGY_FOR_OPEN_CONDITIONS
} from "../services/recategorisation/filter/recategorisationFilter";

describe('removeFilterFromFullUrl', () => {
  test('it should remove filter when there is only one filter applied', async () => {
    const result = removeFilterFromFullUrl(
      LOW_RISK_OF_ESCAPE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape',
      1
    )

    expect(result).toEqual('/recategoriserHome')
  })
  test.each([
    [
      LOW_RISK_OF_ESCAPE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe',
    ],
    [
      NOT_MARKED_AS_NOT_FOR_RELEASE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe',
    ],
    [
      STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe',
    ],
    [
      OVERDUE,
      DUE_DATE,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&pom%5B%5D=reviewsAssignedToMe',
    ],
    [
      REVIEWS_ASSIGNED_TO_ME,
      POM,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue',
    ],
  ])(
    'It should remove %s filter correctly with %s key when there are multiple filters applied',
    async (
      filter:
        | RecategorisationHomeFilterSuitabilityForOpenConditionsValue
        | RecategorisationHomeFilterDueDateValue
        | RecategorisationHomeFilterPomValue,
      key: keyof RecategorisationHomeFilters,
      expectedResult: string
    ) => {
      const result = removeFilterFromFullUrl(
        filter,
        key,
        '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe',
        5
      )

      expect(result).toEqual(expectedResult)
    }
  )
})
