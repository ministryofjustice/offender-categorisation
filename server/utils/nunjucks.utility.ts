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
  let url = fullUrl
  if (url.indexOf('filterRemoved') >= 0) {
    url = url.substring(0, url.indexOf('filterRemoved') - 1)
  }
  const startPositionOfFilterInUrl = url.indexOf(filter) - (key.length + 7)
  return `${
    url.substring(
      0,
      url[startPositionOfFilterInUrl - 1] === '&' || numberOfFiltersApplied === 1
        ? startPositionOfFilterInUrl - 1
        : startPositionOfFilterInUrl
    ) +
    url.substring(
      url.indexOf(filter) + filter.length + (url[startPositionOfFilterInUrl - 1] === '&' ? 0 : 1),
      url.length
    ) +
    (numberOfFiltersApplied > 1 ? '&' : '?')
  }filterRemoved=${filter}`
}

export default removeFilterFromFullUrl
