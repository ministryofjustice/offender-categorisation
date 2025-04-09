import type {
  HomeFilterDueDateValue,
  HomeFilterPomValue,
  RecategorisationHomeFilterSuitabilityForOpenConditionsValue,
} from '../services/filter/homeFilter'
import { CategorisationHomeFilters, RecategorisationHomeFilters } from '../services/filter/homeFilter'
import { config } from '../config'

export const removeFilterFromFullUrl = (
  filter: RecategorisationHomeFilterSuitabilityForOpenConditionsValue | HomeFilterDueDateValue | HomeFilterPomValue,
  key: keyof RecategorisationHomeFilters | keyof CategorisationHomeFilters,
  fullUrl: string,
) => {
  const url = new URL(fullUrl, config.domain)
  if (url.searchParams.has('filterRemoved')) {
    url.searchParams.delete('filterRemoved')
  }
  url.searchParams.delete(`${key}[]`, filter)
  url.searchParams.append('filterRemoved', filter)
  return url.toString().substring(config.domain.length)
}

export default removeFilterFromFullUrl
