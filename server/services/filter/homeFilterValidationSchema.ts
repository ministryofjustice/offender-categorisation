import joi from 'joi'
import { categorisationHomeFilters, recategorisationHomeFilters } from './homeFilter'

const buildHomeSchemaFilters = filters => {
  const homeSchemaFilters = {}
  Object.keys(filters).forEach(key => {
    homeSchemaFilters[key] = joi
      .array()
      .items(
        joi
          .string()
          .valid(...Object.keys(filters[key]))
          .required()
      )
      .optional()
  })
  return homeSchemaFilters
}

export const recategorisationHomeSchema = joi
  .object({
    ...buildHomeSchemaFilters(recategorisationHomeFilters),
    filterRemoved: joi.string().optional(),
  })
  .optional()

export const categorisationHomeSchema = joi
  .object({
    ...buildHomeSchemaFilters(categorisationHomeFilters),
    filterRemoved: joi.string().optional(),
    sortDirection: joi.string().allow('').valid('ascending', 'descending', '').optional(),
    sortAttribute: joi.string().allow('').optional(),
  })
  .optional()
