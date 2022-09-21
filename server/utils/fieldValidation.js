const baseJoi = require('joi')
const dateExtend = require('@joi/date')
const moment = require('moment')
const { getFieldName, getFieldDetail, mergeWithRight, getIn, isNilOrEmpty } = require('./functionalHelpers')

const joi = baseJoi.extend(dateExtend)

function mapJoiErrors(joiErrors, fieldsConfig) {
  if (isNilOrEmpty(joiErrors.error)) {
    return []
  }
  return joiErrors.error.details.map(error => {
    const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])
    const errorMessage = getIn([...error.path, 'validationMessage'], fieldConfig) || error.message

    return {
      text: errorMessage,
      href: `#${getFieldName(fieldConfig)}`,
    }
  })
}

module.exports = {
  validate(formResponse, pageConfig) {
    const formSchema = createSchemaFromConfig(pageConfig)
    const joiErrors = formSchema.validate(formResponse, { stripUnknown: false, abortEarly: false })
    const fieldsConfig = getIn(['fields'], pageConfig)

    return mapJoiErrors(joiErrors, fieldsConfig)
  },
  mapJoiErrors,
}

function createSchemaFromConfig(pageConfig) {
  const yesterday = moment().subtract(1, 'd').format('MM/DD/YYYY')
  const tomorrow = moment().add(1, 'd').format('MM/DD/YYYY')

  const fieldOptions = {
    requiredString: joi.string().required(),
    optionalString: joi.string().allow('').optional(),
    requiredDay: joi.date().format('DD').required(),
    requiredMonth: joi.date().format('MM').required(),
    requiredYear: joi.date().format('YYYY').required(),
    futureDate: joi.date().format('D/M/YYYY').min(tomorrow).required(),
    pastDate: joi.date().allow('').format('D/M/YYYY').max(yesterday).optional(),
    requiredYesNoIf: (requiredItem = 'decision', requiredAnswer = 'Yes') =>
      joi.when(requiredItem, {
        is: requiredAnswer,
        then: joi.string().valid('Yes', 'No').required(),
        otherwise: joi.any().optional(),
      }),
    requiredStringIf: (requiredItem = 'decision', requiredAnswer = 'Yes') =>
      joi.when(requiredItem, {
        is: requiredAnswer,
        then: joi.string().required(),
        otherwise: joi.any().optional(),
      }),
  }

  const formSchema = pageConfig.fields.reduce((schema, field) => {
    const fieldName = getFieldName(field)

    const fieldConfigResponseType = getFieldDetail(['responseType'], field)
    const [responseType, ...fieldArgs] = fieldConfigResponseType.split('_')

    const joiFieldItem = fieldOptions[responseType]
    const joiFieldSchema = typeof joiFieldItem === 'function' ? joiFieldItem(...fieldArgs) : joiFieldItem

    return mergeWithRight(schema, { [fieldName]: joiFieldSchema })
  }, {})

  return joi.object().keys(formSchema)
}
