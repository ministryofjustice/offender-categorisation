import { RecategorisationHomeFilters } from './homeFilter'

const makeTestRecategorisationHomeFiltersFilter = (
  recategorisationHomeFilters: Partial<RecategorisationHomeFilters> = {},
): RecategorisationHomeFilters => ({
  suitabilityForOpenConditions: recategorisationHomeFilters.suitabilityForOpenConditions ?? [],
  dueDate: recategorisationHomeFilters.dueDate ?? [],
  pom: recategorisationHomeFilters.pom ?? [],
})

export default makeTestRecategorisationHomeFiltersFilter
