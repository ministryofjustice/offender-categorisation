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
    const formSchema = createSchemaFromConfig(pageConfig)
    const joiErrors = formSchema.validate(formResponse, { stripUnknown: false, abortEarly: false })
    const fieldsConfig = getIn(['fields'], pageConfig)

    return mapJoiErrors(joiErrors, fieldsConfig)
  },
  mapJoiErrors,
}

const makeDateValidation = (min = undefined, max = undefined, allowEmpty = false) => {
  const joiAlternatives = []
  ;['D/M/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'DD/MM/YYYY'].forEach(dateFormat => {
    const validator = joi.date().format(dateFormat)
    if (typeof min !== 'undefined') {
      validator.min(min)
    }
    if (typeof max !== 'undefined') {
      validator.max(max)
    }
    if (allowEmpty) {
      validator.allow('').optional()
    } else {
      validator.required()
    }
    joiAlternatives.push(validator)
  })
  return joi.alternatives(joiAlternatives)
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
    futureDate: makeDateValidation(tomorrow),
    pastDate: makeDateValidation(undefined, yesterday, true),
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
    //  The below check is for Next review date validation. CAT-907.
    indeterminateCheck: (requiredItem = 'indeterminate', requiredAnswer = 'true') =>
      joi.when(requiredItem, {
        is: requiredAnswer,
        then: makeDateValidation(today, threeYears).messages({
          'date.format': 'The review date must be a real date',
          'date.max': 'The date that they are reviewed by must be within 3 years',
          'date.min': 'The review date must be today or in the future',
        }),
        otherwise: makeDateValidation(today, oneYear).messages({
          'date.format': 'The review date must be a real date',
          'date.max': 'The date that they are reviewed must be within the next 12 months',
          'date.min': 'The review date must be today or in the future',
        }),
      }),
    todayOrPastDate: makeDateValidation(undefined, today).messages({
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
