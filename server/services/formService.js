const { equals } = require('../utils/functionalHelpers')
const { validate } = require('../utils/fieldValidation')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')

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

  async function referToSecurityIfRiskAssessed(bookingId, userId, socProfile) {
    if (socProfile.transferToSecurity) {
      try {
        const newVar = await formClient.referToSecurity(bookingId, userId, Status.SECURITY_AUTO.name)
        if (newVar.rowCount === 0) {
          // May be no record in db yet - ensure this is the case and insert it
          const current = await getCategorisationRecord(bookingId)
          if (current.form_response) {
            throw new Error(`Invalid state, booking id ${bookingId}`)
          }
          await formClient.update(null, '{}', bookingId, userId, Status.STARTED.name, userId, null)
          await formClient.referToSecurity(bookingId, userId, Status.SECURITY_AUTO.name)
        }
      } catch (error) {
        logger.error(error)
      }
    }
    return {}
  }

  async function referToSecurityIfRequested(bookingId, userId, updatedFormObject) {
    if (updatedFormObject.ratings.securityInput.securityInputNeeded === 'Yes') {
      try {
        await formClient.referToSecurity(bookingId, userId, Status.SECURITY_MANUAL.name)
      } catch (error) {
        logger.error(error)
      }
    }
    return {}
  }

  function calculateStatus() {
    return Status.STARTED.name
  }

  return {
    getCategorisationRecord,
    update,
    getValidationErrors: validate,
    referToSecurityIfRiskAssessed,
    referToSecurityIfRequested,
  }
}
