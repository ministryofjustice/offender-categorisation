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
    const prefix = getIn([...error.path, 'errorMessagePrefix'], fieldConfig)
    const errorMessage = getIn([...error.path, 'validationMessage'], fieldConfig) || error.message

    return {
      text: prefix ? prefix.concat(' ', errorMessage) : errorMessage,
      href: `#${getFieldName(fieldConfig)}`,
    }
  })
}

module.exports = {
  validate(formResponse, pageConfig) {
    const localFormResponse = { ...formResponse }
    const formSchema = createSchemaFromConfig(pageConfig)

    // we want to accept dates with or without leading 0s e.g. 01/01/2024 and 1/1/2024, so this removes any leading zeros before running through the validator
    pageConfig.fields.forEach(field => {
      const fieldName = getFieldName(field)
      const fieldConfigResponseType = getFieldDetail(['responseType'], field)
      const [responseType] = fieldConfigResponseType.split('_')
      if (['futureDate', 'pastDate', 'indeterminateCheck', 'todayOrPastDate'].includes(responseType)) {
        localFormResponse[fieldName] = localFormResponse[fieldName]?.replace(/^0+/, '')?.replace(/\/0/g, '/')
      }
    })

    const joiErrors = formSchema.validate(localFormResponse, { stripUnknown: false, abortEarly: false })
    const fieldsConfig = getIn(['fields'], pageConfig)

    return mapJoiErrors(joiErrors, fieldsConfig)
  },
  mapJoiErrors,
}

function createSchemaFromConfig(pageConfig) {
  const yesterday = moment().subtract(1, 'd').format('MM/DD/YYYY')
  const tomorrow = moment().add(1, 'd').format('MM/DD/YYYY')
  const threeYears = moment().add(3, 'y').format('MM/DD/YYYY')
  const oneYear = moment().add(1, 'y').format('MM/DD/YYYY')
  const today = moment().format('MM/DD/YYYY')

  const fieldOptions = {
    requiredString: joi.string().trim().required(),
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
        then: joi.string().trim().required(),
        otherwise: joi.any().optional(),
      }),
    requiredStringNotExists: (requiredItem = 'decision') =>
      joi.when(requiredItem, {
        is: joi.exist(),
        then: joi.any().optional(),
        otherwise: joi.string().trim().required(),
      }),
    provisionalCategoryOverriddenCategoryTextValidation: () =>
      joi.when('justification', {
        is: joi.exist(),
        then: joi.any().optional(),
        otherwise: joi.when('categoryAppropriate', {
          is: 'No',
          then: joi.string().trim().required(),
          otherwise: joi.any().optional(),
        }),
      }),
    //  The below check is for Next review date validation. CAT-907.
    indeterminateCheck: (requiredItem = 'indeterminate', requiredAnswer = 'true') =>
      joi.when(requiredItem, {
        is: requiredAnswer,
        then: joi.date().format('D/M/YYYY').min(today).max(threeYears).required().messages({
          'date.format': 'The review date must be a real date',
          'date.max': 'The date that they are reviewed by must be within 3 years',
          'date.min': 'The review date must be today or in the future',
        }),
        otherwise: joi.date().format('D/M/YYYY').min(today).max(oneYear).required().messages({
          'date.format': 'The review date must be a real date',
          'date.max': 'The date that they are reviewed must be within the next 12 months',
          'date.min': 'The review date must be today or in the future',
        }),
      }),
    todayOrPastDate: joi.date().format('D/M/YYYY').max(today).required().messages({
      'date.format': 'must be a real date',
      'date.max': 'must be today or in the past',
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
