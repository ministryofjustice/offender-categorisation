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
      throw error
    }
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

  async function referToSecurityIfRiskAssessed(bookingId, userId, socProfile, currentStatus) {
    if (socProfile.transferToSecurity) {
      let status
      if (!currentStatus) {
        // No record in db yet - ensure we have an initial record
        await formClient.update(null, '{}', bookingId, userId, Status.STARTED.name, userId, null)
        status = Status.STARTED
      } else {
        status = Status[currentStatus]
      }
      if (Status.SECURITY_AUTO.previous.includes(status) && currentStatus !== Status.SECURITY_AUTO) {
        try {
          await formClient.referToSecurity(bookingId, null, Status.SECURITY_AUTO.name)
        } catch (error) {
          logger.error(error)
          throw error
        }
      } else {
        logger.warn(`Cannot transition from status ${status && status.name} to SECURITY_AUTO, bookingId=${bookingId}`)
      }
    }
    return {}
  }

  async function referToSecurityIfRequested(bookingId, userId, updatedFormObject) {
    if (updatedFormObject.ratings.securityInput.securityInputNeeded === 'Yes') {
      const currentCategorisation = await getCategorisationRecord(bookingId)
      const currentStatus = currentCategorisation.status
      const status = Status[currentStatus]
      if (Status.SECURITY_MANUAL.previous.includes(status) && currentStatus !== Status.SECURITY_MANUAL) {
        try {
          await formClient.referToSecurity(bookingId, userId, Status.SECURITY_MANUAL.name)
        } catch (error) {
          logger.error(error)
          throw error
        }
      } else {
        logger.warn(`Cannot transition from status ${status && status.name} to SECURITY_MANUAL, bookingId=${bookingId}`)
      }
    }
    return {}
  }

  async function backFromSecurity(bookingId) {
    const currentCategorisation = await getCategorisationRecord(bookingId)
    const currentStatus = currentCategorisation.status
    const status = Status[currentStatus]
    if (Status.SECURITY_BACK.previous.includes(status) && currentStatus !== Status.SECURITY_BACK) {
      try {
        await formClient.backFromSecurity(bookingId)
      } catch (error) {
        logger.error(error)
        throw error
      }
    } else {
      logger.warn(`Cannot transition from status ${status && status.name} to SECURITY_BACK, bookingId=${bookingId}`)
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
    backFromSecurity,
  }
}
