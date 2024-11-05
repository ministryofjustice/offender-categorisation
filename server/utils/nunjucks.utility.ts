import { RecategorisationHomeFilters } from '../services/recategorisation/filter/recategorisationFilter'
import type {
  RecategorisationHomeFilterDueDateValue,
  RecategorisationHomeFilterPomValue,
  RecategorisationHomeFilterSuitabilityForOpenConditionsValue,
} from '../services/recategorisation/filter/recategorisationFilter'
import config from '../config'

export const removeFilterFromFullUrl = (
  filter:
    | RecategorisationHomeFilterSuitabilityForOpenConditionsValue
    | RecategorisationHomeFilterDueDateValue
    | RecategorisationHomeFilterPomValue,
  key: keyof RecategorisationHomeFilters,
  fullUrl: string
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
