const { equals, isNilOrEmpty, getFieldDetail, getFieldName, getIn } = require('../utils/functionalHelpers')
const { validate } = require('../utils/fieldValidation')
const logger = require('../../log.js')

module.exports = function createSomeService(formClient) {
  async function getCategorisationRecord(bookingId) {
    try {
      const data = await formClient.getFormDataForUser(bookingId)
      return data.rows[0] || {}
    } catch (error) {
      logger.error(error)
    }
    return {}
  }

  async function update({ bookingId, userId, config, userInput, formSection, formName }) {
    const currentCategorisation = await getCategorisationRecord(bookingId)
    const currentCategorisationForm = currentCategorisation.form_response || {}

    const newCategorisationForm = buildCategorisationForm({
      formObject: currentCategorisation.form_response || {},
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    if (equals(currentCategorisationForm, newCategorisationForm)) {
      // this wont work if wanting to switch assigned user without updating the form
      return currentCategorisationForm
    }

    await formClient.update(
      currentCategorisation.id,
      newCategorisationForm,
      bookingId,
      userId,
      calculateStatus(),
      userId
    )
    return newCategorisationForm
  }

  function buildCategorisationForm({ formObject, fieldMap, userInput, formSection, formName }) {
    const answers = fieldMap ? fieldMap.reduce(answersFromMapReducer(userInput), {}) : {}

    return {
      ...formObject,
      [formSection]: {
        ...formObject[formSection],
        [formName]: answers,
      },
    }
  }

  function answersFromMapReducer(userInput) {
    return (answersAccumulator, field) => {
      const { fieldName, answerIsRequired } = getFieldInfo(field, userInput)

      if (!answerIsRequired) {
        return answersAccumulator
      }

      return { ...answersAccumulator, [fieldName]: userInput[fieldName] }
    }
  }

  function getFieldInfo(field, userInput) {
    const fieldName = Object.keys(field)[0]
    const fieldConfig = field[fieldName]

    const fieldDependentOn = userInput[fieldConfig.dependentOn]
    const predicateResponse = fieldConfig.predicate
    const dependentMatchesPredicate = fieldConfig.dependentOn && fieldDependentOn === predicateResponse

    return {
      fieldName,
      answerIsRequired: !fieldDependentOn || dependentMatchesPredicate,
    }
  }

  function calculateStatus() {
    return 'STARTED'
  }

  return {
    getCategorisationRecord,
    update,
    getValidationErrors: validate,
  }
}
