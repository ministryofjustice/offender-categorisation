import { RecategorisationHomeFilters } from './recategorisationFilter'

const makeTestRecategorisationHomeFiltersFilter = (
  recategorisationHomeFilters: Partial<RecategorisationHomeFilters> = {}
): RecategorisationHomeFilters => ({
  suitabilityForOpenConditions: recategorisationHomeFilters.suitabilityForOpenConditions ?? [],
  dueDate: recategorisationHomeFilters.dueDate ?? [],
})

export default makeTestRecategorisationHomeFiltersFilter
