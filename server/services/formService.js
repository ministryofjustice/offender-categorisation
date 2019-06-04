const { validate } = require('../utils/fieldValidation')
const moment = require('moment')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const { isNilOrEmpty, pickBy, getFieldName } = require('../utils/functionalHelpers')
const conf = require('../../server/config')
const log = require('../../log')
const { filterJsonObjectForLogging } = require('../utils/utils')

function dataIfExists(data) {
  return data.rows[0]
}

module.exports = function createFormService(formClient) {
  async function getCategorisationRecord(bookingId, transactionalClient) {
    try {
      const data = await formClient.getFormDataForUser(bookingId, transactionalClient)
      return dataIfExists(data) || {}
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function update({
    bookingId,
    config,
    userInput,
    formSection,
    formName,
    status,
    transactionalClient,
    logUpdate,
  }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const newCategorisationForm = buildCategorisationForm({
      formObject: currentCategorisation.formObject || {},
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    if (validateStatusIfProvided(currentCategorisation.status, status)) {
      if (logUpdate) {
        log.info(
          `Updating Categorisation for booking Id: ${bookingId}, offender No: ${
            currentCategorisation.offenderNo
          }. user name: ${currentCategorisation.userId} \nWith details ${JSON.stringify(
            filterJsonObjectForLogging(userInput)
          )}`
        )
      }
      await formClient.update(
        currentCategorisation.id,
        newCategorisationForm,
        bookingId,
        calculateStatus(currentCategorisation.status, status),
        transactionalClient
      )
      return newCategorisationForm
    }
    throw new Error(`Invalid state transition from ${currentCategorisation.status} to ${status}`)
  }

  async function supervisorApproval({ bookingId, config, userInput, formSection, formName, transactionalClient }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const newCategorisationForm = buildCategorisationForm({
      formObject: currentCategorisation.formObject || {},
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    if (validateStatusIfProvided(currentCategorisation.status, Status.APPROVED.name)) {
      log.info(
        `Supervisor approval for booking Id: ${bookingId}, offender No: ${
          currentCategorisation.offenderNo
        }. user name: ${currentCategorisation.userId} \nWith details ${JSON.stringify(
          filterJsonObjectForLogging(userInput)
        )}`
      )
      await formClient.supervisorApproval(
        currentCategorisation.id,
        newCategorisationForm,
        bookingId,
        transactionalClient
      )
      return newCategorisationForm
    }
    throw new Error(
      `Invalid state transition in supervisorApproval from ${currentCategorisation.status} to ${Status.APPROVED.name}`
    )
  }

  async function createCategorisationRecord(bookingId, userId, prisonId, offenderNo, catType, transactionalClient) {
    await formClient.create({
      bookingId,
      catType,
      userId,
      status: Status.STARTED.name,
      assignedUserId: userId,
      prisonId,
      offenderNo,
      transactionalClient,
    })
    return getCategorisationRecord(bookingId, transactionalClient)
  }

  async function createOrRetrieveCategorisationRecord(
    bookingId,
    userId,
    prisonId,
    offenderNo,
    catType,
    transactionalClient
  ) {
    const data = await formClient.getFormDataForUser(bookingId, transactionalClient)
    const currentRecord = dataIfExists(data)

    if (!currentRecord) {
      const record = await createCategorisationRecord(
        bookingId,
        userId,
        prisonId,
        offenderNo,
        catType,
        transactionalClient
      )
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

  async function updateFormData(bookingId, data, transactionalClient) {
    await formClient.updateFormData(bookingId, data, transactionalClient)
  }

  async function mergeRiskProfileData(bookingId, data, transactionalClient) {
    const oldRecord = await getCategorisationRecord(bookingId, transactionalClient)
    await formClient.updateRiskProfileData(
      bookingId,
      oldRecord && oldRecord.riskProfile ? { ...oldRecord.riskProfile, ...data } : data,
      transactionalClient
    )
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
      (data.ratings && data.ratings.securityBack && data.ratings.securityBack.catB === 'Yes') ||
      (data.violenceProfile && data.violenceProfile.veryHighRiskViolentOffender) ||
      (data.violenceProfile && data.violenceProfile.numberOfSeriousAssaults > 0) || // note: Qs on page ignored (info only)
      (data.ratings && data.ratings.escapeRating && data.ratings.escapeRating.escapeCatB === 'Yes') || // Other Q is info only
      (data.extremismProfile && data.extremismProfile.provisionalCategorisation === 'B') ||
      (data.ratings &&
        data.ratings.extremismRating &&
        data.ratings.extremismRating.previousTerrorismOffences === 'Yes') ||
      (data.ratings && data.ratings.furtherCharges && data.ratings.furtherCharges.furtherChargesCatB === 'Yes')
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

  async function referToSecurityIfRiskAssessed(bookingId, userId, socProfile, currentStatus, transactionalClient) {
    if (socProfile.transferToSecurity && currentStatus !== Status.SECURITY_BACK.name) {
      if (validateStatusIfProvided(currentStatus, Status.SECURITY_AUTO.name)) {
        try {
          await formClient.referToSecurity(bookingId, null, Status.SECURITY_AUTO.name, transactionalClient)
        } catch (error) {
          logger.error(error)
          throw error
        }
      } else {
        logger.warn(`Cannot transition from status ${currentStatus} to SECURITY_AUTO, bookingId=${bookingId}`)
      }
    }
  }

  async function referToSecurityIfRequested(bookingId, userId, updatedFormObject, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const section =
      currentCategorisation.catType === CatType.RECAT.name ? updatedFormObject.recat : updatedFormObject.ratings
    if (section.securityInput.securityInputNeeded === 'Yes') {
      const currentStatus = currentCategorisation.status
      if (validateStatusIfProvided(currentStatus, Status.SECURITY_MANUAL.name)) {
        try {
          await formClient.referToSecurity(bookingId, userId, Status.SECURITY_MANUAL.name, transactionalClient)
        } catch (error) {
          logger.error(error)
          throw error
        }
      } else {
        logger.warn(`Cannot transition from status ${currentStatus} to SECURITY_MANUAL, bookingId=${bookingId}`)
      }
    }
    return {}
  }

  async function backToCategoriser(bookingId, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const currentStatus = currentCategorisation.status
    if (validateStatusIfProvided(currentStatus, Status.SUPERVISOR_BACK.name)) {
      try {
        await formClient.updateStatus(bookingId, Status.SUPERVISOR_BACK.name, transactionalClient)
        log.info(
          `Supervisor sent back categorisation record for : ${bookingId}, offender No: ${
            currentCategorisation.offenderNo
          }. user name: ${currentCategorisation.userId}`
        )
      } catch (error) {
        logger.error(error)
        throw error
      }
    } else {
      logger.warn(`Cannot transition from status ${currentStatus} to SUPERVISOR_BACK, bookingId=${bookingId}`)
    }
  }

  async function securityReviewed(bookingId, userId, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const currentStatus = currentCategorisation.status
    if (validateStatusIfProvided(currentStatus, Status.SECURITY_BACK.name)) {
      try {
        await formClient.securityReviewed(bookingId, Status.SECURITY_BACK.name, userId, transactionalClient)
      } catch (error) {
        logger.error(error)
        throw error
      }
    } else {
      logger.warn(`Cannot transition from status ${currentStatus} to SECURITY_BACK, bookingId=${bookingId}`)
    }
    return {}
  }

  async function getCategorisedOffenders(agencyId, transactionalClient) {
    const displayMonths = conf.approvedDisplayMonths
    const fromDate = moment()
      .subtract(displayMonths, 'months')
      .toDate()
    try {
      const data = await formClient.getApprovedCategorisations(agencyId, fromDate, transactionalClient)
      return data.rows || []
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getSecurityReviewedOffenders(agencyId, transactionalClient) {
    try {
      const data = await formClient.getSecurityReviewedCategorisationRecords(agencyId, transactionalClient)
      return data.rows || []
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getSecurityReferredOffenders(agencyId, transactionalClient) {
    try {
      const data = await formClient.getCategorisationRecordsByStatus(
        agencyId,
        [Status.SECURITY_MANUAL.name, Status.SECURITY_AUTO.name],
        transactionalClient
      )

      return data.rows || []
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  function calculateStatus(currentStatus, newStatus) {
    return newStatus || currentStatus || Status.STARTED.name // status may not be changing
  }

  function validateStatusIfProvided(current, proposed) {
    return proposed ? Status[proposed].previous.includes(Status[current]) : true
  }

  function isValid(formPageConfig, req, res, section, form, bookingId) {
    if (formPageConfig.validate && formPageConfig.fields) {
      const expectedFields = formPageConfig.fields.map(getFieldName)
      const inputForExpectedFields = pickBy((val, key) => expectedFields.includes(key), req.body)

      const errors = validate(inputForExpectedFields, formPageConfig)
      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        req.flash('userInput', inputForExpectedFields)
        req.flash('backLink', inputForExpectedFields)
        res.redirect(`/form/${section}/${form}/${bookingId}`)
        return false
      }
    }
    return true
  }

  return {
    getCategorisationRecord,
    update,
    updateFormData,
    mergeRiskProfileData,
    computeSuggestedCat,
    referToSecurityIfRiskAssessed,
    referToSecurityIfRequested,
    securityReviewed,
    validateStatus: validateStatusIfProvided,
    createOrRetrieveCategorisationRecord,
    createCategorisationRecord,
    backToCategoriser,
    validate,
    isValid,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getSecurityReferredOffenders,
    isYoungOffender,
    supervisorApproval,
  }
}
