import { removeFilterFromFullUrl } from './nunjucks.utility'
import {
  CategorisationHomeFilters,
  DUE_DATE,
  HomeFilterDueDateValue,
  HomeFilterPomValue,
  LOW_RISK_OF_ESCAPE,
  NOT_MARKED_AS_NOT_FOR_RELEASE,
  OVERDUE,
  POM,
  RecategorisationHomeFilters,
  RecategorisationHomeFilterSuitabilityForOpenConditionsValue,
  REVIEWS_ASSIGNED_TO_ME,
  STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
  SUITABILIGY_FOR_OPEN_CONDITIONS,
} from '../services/filter/homeFilter'

describe('removeFilterFromFullUrl', () => {
  test('it should remove filter when there is only one filter applied', () => {
    const result = removeFilterFromFullUrl(
      LOW_RISK_OF_ESCAPE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape',
    )

    expect(result).toEqual('/recategoriserHome?filterRemoved=lowRiskOfEscape')
  })
  test('it should remove filter correctly after another filter has been removed', () => {
    const result = removeFilterFromFullUrl(
      LOW_RISK_OF_ESCAPE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&filterRemoved=notMarkedAsNotForRelease',
    )

    expect(result).toEqual('/recategoriserHome?filterRemoved=lowRiskOfEscape')
  })
  test.each([
    [
      LOW_RISK_OF_ESCAPE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe&filterRemoved=lowRiskOfEscape',
    ],
    [
      NOT_MARKED_AS_NOT_FOR_RELEASE,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe&filterRemoved=notMarkedAsNotForRelease',
    ],
    [
      STANDARD_OR_ENHANCED_INCENTIVE_LEVEL,
      SUITABILIGY_FOR_OPEN_CONDITIONS,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe&filterRemoved=standardOrEnhancedIncentiveLevel',
    ],
    [
      OVERDUE,
      DUE_DATE,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&pom%5B%5D=reviewsAssignedToMe&filterRemoved=overdue',
    ],
    [
      REVIEWS_ASSIGNED_TO_ME,
      POM,
      '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&filterRemoved=reviewsAssignedToMe',
    ],
  ])(
    'It should remove %s filter correctly with %s key when there are multiple filters applied',
    (
      filter: RecategorisationHomeFilterSuitabilityForOpenConditionsValue | HomeFilterDueDateValue | HomeFilterPomValue,
      key: keyof RecategorisationHomeFilters | keyof CategorisationHomeFilters,
      expectedResult: string,
    ) => {
      const result = removeFilterFromFullUrl(
        filter,
        key,
        '/recategoriserHome?suitabilityForOpenConditions%5B%5D=lowRiskOfEscape&suitabilityForOpenConditions%5B%5D=notMarkedAsNotForRelease&suitabilityForOpenConditions%5B%5D=standardOrEnhancedIncentiveLevel&dueDate%5B%5D=overdue&pom%5B%5D=reviewsAssignedToMe',
      )

      expect(result).toEqual(expectedResult)
    },
  )
})
