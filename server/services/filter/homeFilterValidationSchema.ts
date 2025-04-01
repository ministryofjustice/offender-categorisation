import joi from 'joi'
import { categorisationHomeFilters, recategorisationHomeFilters } from './homeFilter'

const SORT_DIRECTION_ASCENDING = 'ascending'
const SORT_DIRECTION_DESCENDING = 'descending'

const buildHomeSchemaFilters = filters => {
  const homeSchemaFilters = {}
  Object.keys(filters).forEach(key => {
    homeSchemaFilters[key] = joi
      .array()
      .items(
        joi
          .string()
          .valid(...Object.keys(filters[key]))
          .required(),
      )
      .optional()
  })
  return homeSchemaFilters
}

export const recategorisationHomeSchema = joi
  .object({
    ...buildHomeSchemaFilters(recategorisationHomeFilters),
    filterRemoved: joi.string().optional(),
    sortDirection: joi.string().allow('').valid(SORT_DIRECTION_ASCENDING, SORT_DIRECTION_DESCENDING, '').optional(),
    sortAttribute: joi.string().allow('').optional(),
  })
  .optional()

export const categorisationHomeSchema = joi
  .object({
    ...buildHomeSchemaFilters(categorisationHomeFilters),
    filterRemoved: joi.string().optional(),
    sortDirection: joi.string().allow('').valid(SORT_DIRECTION_ASCENDING, SORT_DIRECTION_DESCENDING, '').optional(),
    sortAttribute: joi.string().allow('').optional(),
  })
  .optional()
