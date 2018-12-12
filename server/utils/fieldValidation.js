const baseJoi = require('joi')
const dateExtend = require('joi-date-extensions')
const postcodeExtend = require('joi-postcode')

const joi = baseJoi.extend(dateExtend).extend(postcodeExtend)

const fieldOptions = {
  requiredString: joi.string().required(),
  optionalString: joi
    .string()
    .allow('')
    .optional(),
  requiredDay: joi
    .date()
    .format('DD')
    .required(),
  requiredMonth: joi
    .date()
    .format('MM')
    .required(),
  requiredYear: joi
    .date()
    .format('YYYY')
    .required(),
  requiredPostcode: joi.postcode().required(),
}

module.exports = {
  validate(value, fieldType) {
    return joi.validate(value, fieldOptions[fieldType], { stripUnknown: true, abortEarly: false })
  },
}
