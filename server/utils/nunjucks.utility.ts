import { RecategorisationHomeFilters } from '../services/recategorisation/filter/recategorisationFilter'
import type {
  RecategorisationHomeFilterDueDateValue,
  RecategorisationHomeFilterPomValue,
  RecategorisationHomeFilterSuitabilityForOpenConditionsValue,
} from '../services/recategorisation/filter/recategorisationFilter'

export const removeFilterFromFullUrl = (
  filter:
    | RecategorisationHomeFilterSuitabilityForOpenConditionsValue
    | RecategorisationHomeFilterDueDateValue
    | RecategorisationHomeFilterPomValue,
  key: keyof RecategorisationHomeFilters,
  fullUrl: string,
  numberOfFiltersApplied: number
) => {
  const startPositionOfFilterInUrl = fullUrl.indexOf(filter) - (key.length + 7)
  return `${
    fullUrl.substring(
      0,
      fullUrl[startPositionOfFilterInUrl - 1] === '&' || numberOfFiltersApplied === 1
        ? startPositionOfFilterInUrl - 1
        : startPositionOfFilterInUrl
    ) +
    fullUrl.substring(
      fullUrl.indexOf(filter) + filter.length + (fullUrl[startPositionOfFilterInUrl - 1] === '&' ? 0 : 1),
      fullUrl.length
    ) +
    (numberOfFiltersApplied > 1 ? '&' : '?')
  }filterRemoved=${filter}`
}

export default removeFilterFromFullUrl
