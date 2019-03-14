const { validate } = require('../utils/fieldValidation')
const moment = require('moment')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')

module.exports = function createFormService(formClient) {
  async function getCategorisationRecord(bookingId) {
    try {
      const data = await formClient.getFormDataForUser(bookingId)
      return data.rows[0] || {}
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function update({ bookingId, userId, config, userInput, formSection, formName, status }) {
    const currentCategorisation = await getCategorisationRecord(bookingId)

    const newCategorisationForm = buildCategorisationForm({
      formObject: currentCategorisation.form_response || {},
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    if (validateStatusIfProvided(currentCategorisation.status, status)) {
      await formClient.update(
        currentCategorisation.id,
        newCategorisationForm,
        bookingId,
        userId,
        calculateStatus(currentCategorisation.status, status),
        userId
      )
      return newCategorisationForm
    }
    throw new Error(`Invalid state transition from ${currentCategorisation.status} to ${status}`)
  }

  async function createCategorisationRecord(bookingId, userId) {
    await formClient.update(undefined, {}, bookingId, userId, Status.STARTED.name, userId)
    return getCategorisationRecord(bookingId)
  }

  async function createOrRetrieveCategorisationRecord(bookingId, userId) {
    const currentRecord = await getCategorisationRecord(bookingId)
    if (!currentRecord.status) {
      const record = await createCategorisationRecord(bookingId, userId)
      return record
    }
    return currentRecord
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

  async function updateFormData(bookingId, data) {
    await formClient.updateFormData(bookingId, data)
  }

  function isYoungOffender(details) {
    const dob = details && details.dateOfBirth
    if (!dob) {
      return false
    }
    const d = moment(dob, 'YYYY-MM-DD')
    return d.isAfter(moment().subtract(21, 'years'))
  }

  function computeSuggestedCat(data) {
    if (isYoungOffender(data.details)) {
      return 'I'
    }
    if (
      (data.history && data.history.catAType) ||
      (data.securityBack && data.securityBack.catB === 'Yes') ||
      (data.violenceProfile && data.violenceProfile.veryHighRiskViolentOffender) ||
      (data.violenceProfile && data.violenceProfile.numberOfSeriousAssaults > 0) || // note: Qs on page ignored (info only)
      (data.ratings && data.ratings.escapeRating && data.ratings.escapeRating.escapeFurtherCharges === 'Yes') || // ( in fact Q is now whether user thinks should be B based on alert data)
      (data.extremismProfile && data.extremismProfile.provisionalCategorisation === 'B')
    ) {
      return 'B'
    }
    return 'C'
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
    if (socProfile.transferToSecurity && currentStatus !== Status.SECURITY_BACK.name) {
      if (Status.SECURITY_AUTO.previous.includes(Status[currentStatus]) && currentStatus !== Status.SECURITY_AUTO) {
        try {
          await formClient.referToSecurity(bookingId, null, Status.SECURITY_AUTO.name)
        } catch (error) {
          logger.error(error)
          throw error
        }
      } else {
        logger.warn(`Cannot transition from status ${currentStatus} to SECURITY_AUTO, bookingId=${bookingId}`)
      }
    }
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

  function calculateStatus(currentStatus, newStatus) {
    return newStatus || currentStatus || Status.STARTED.name // status may not be changing
  }

  function validateStatusIfProvided(current, proposed) {
    return proposed ? Status[proposed].previous.includes(Status[current]) : true
  }

  return {
    getCategorisationRecord,
    update,
    getValidationErrors: validate,
    updateFormData,
    computeSuggestedCat,
    referToSecurityIfRiskAssessed,
    referToSecurityIfRequested,
    backFromSecurity,
    validateStatus: validateStatusIfProvided,
    createOrRetrieveCategorisationRecord,
  }
}
