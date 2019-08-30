const moment = require('moment')
const R = require('ramda')
const { validate } = require('../utils/fieldValidation')
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

  async function getCategorisationRecordUsingSequence(bookingId, seq, transactionalClient) {
    try {
      const data = await formClient.getFormDataUsingSequence(bookingId, seq, transactionalClient)
      return dataIfExists(data) || {}
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getHistoricalCategorisationRecords(bookingId, transactionalClient) {
    try {
      const data = await formClient.getHistoricalFormData(bookingId, transactionalClient)
      return data.rows
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
        newCategorisationForm,
        bookingId,
        calculateStatus(currentCategorisation.status, status),
        transactionalClient
      )
      return newCategorisationForm
    }
    throw new Error(`Invalid state transition from ${currentCategorisation.status} to ${status}`)
  }

  async function categoriserDecisionWithFormResponse({
    bookingId,
    config,
    userInput,
    formSection,
    formName,
    userId,
    transactionalClient,
  }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const newCategorisationForm = buildCategorisationForm({
      formObject: currentCategorisation.formObject || {},
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    log.info(
      `Updating Categorisation for booking Id: ${bookingId}, offender No: ${
        currentCategorisation.offenderNo
      }. user name: ${currentCategorisation.userId} \nWith details ${JSON.stringify(
        filterJsonObjectForLogging(userInput)
      )}`
    )

    await formClient.categoriserDecisionWithFormResponse(newCategorisationForm, bookingId, userId, transactionalClient)
    return newCategorisationForm
  }

  async function categoriserDecision(bookingId, userId, transactionalClient) {
    log.info(`record 'awaiting_approval' for  booking Id: ${bookingId}`)
    await formClient.categoriserDecision(bookingId, userId, transactionalClient)
  }

  async function deleteFormData({ bookingId, formSection, formName, transactionalClient }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const updatedFormObject = removeFormdata(bookingId, currentCategorisation.formObject, formSection, formName)

    if (updatedFormObject) {
      await formClient.updateFormData(bookingId, updatedFormObject, transactionalClient)
    }
  }

  function removeFormdata(bookingId, formObject, formSection, formName) {
    const updated = Object.assign({}, formObject)
    if (updated[formSection]) {
      if (updated[formSection][formName]) {
        log.debug(`deleting form for booking Id: ${bookingId}, form section: ${formSection}, form name: ${formName}`)
        delete updated[formSection][formName]
        return updated
      }
    }
    log.debug(
      `Unrequired call to remove form data for booking Id: ${bookingId}, form section: ${formSection}, form name: ${formName}`
    )
    return false
  }

  async function supervisorApproval({
    bookingId,
    config,
    userInput,
    formSection,
    formName,
    userId,
    transactionalClient,
  }) {
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
      await formClient.supervisorApproval(newCategorisationForm, bookingId, userId, transactionalClient)
      return newCategorisationForm
    }
    throw new Error(
      `Invalid state transition in supervisorApproval from ${currentCategorisation.status} to ${Status.APPROVED.name}`
    )
  }

  async function createCategorisationRecord(
    bookingId,
    userId,
    prisonId,
    offenderNo,
    catType,
    reviewReason,
    dueByDate,
    transactionalClient
  ) {
    await formClient.create({
      bookingId,
      catType,
      userId,
      status: Status.STARTED.name,
      assignedUserId: userId,
      prisonId,
      offenderNo,
      reviewReason,
      dueByDate,
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
    reviewReason,
    dueByDate,
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
        reviewReason,
        dueByDate,
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

  async function recordNomisSeqNumber(bookingId, nomisSeq, transactionalClient) {
    try {
      await formClient.updateRecordWithNomisSeqNumber(bookingId, nomisSeq, transactionalClient)
    } catch (error) {
      logger.error(`Failed to record nomis seq number ${nomisSeq} for booking id ${bookingId}`)
      throw error
    }
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
          `Supervisor sent back categorisation record for : ${bookingId}, offender No: ${currentCategorisation.offenderNo}. user name: ${currentCategorisation.userId}`
        )
      } catch (error) {
        logger.error(error)
        throw error
      }
    } else {
      logger.warn(`Cannot transition from status ${currentStatus} to SUPERVISOR_BACK, bookingId=${bookingId}`)
    }
  }

  async function backToCategoriserMessageRead(bookingId, transactionalClient) {
    try {
      const categorisationRecord = await getCategorisationRecord(bookingId, transactionalClient)
      const { formObject } = categorisationRecord
      const newData = R.assocPath(['supervisor', 'confirmBack', 'isRead'], true, formObject)
      await updateFormData(bookingId, newData, transactionalClient)
      return { formObject: newData, ...categorisationRecord }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function setAwaitingApproval(bookingId, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const currentStatus = currentCategorisation.status
    if (validateStatusIfProvided(currentStatus, Status.AWAITING_APPROVAL.name)) {
      try {
        await formClient.updateStatus(bookingId, Status.AWAITING_APPROVAL.name, transactionalClient)
        log.info(
          `Supervisor sent back categorisation record for : ${bookingId}, offender No: ${currentCategorisation.offenderNo}. user name: ${currentCategorisation.userId}`
        )
      } catch (error) {
        logger.error(error)
        throw error
      }
    } else {
      logger.error(`Cannot transition from status ${currentStatus} to AWAITING_APPROVAL, bookingId=${bookingId}`)
      throw new Error(`Cannot transition from status ${currentStatus} to AWAITING_APPROVAL`)
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

  async function getCategorisedOffenders(agencyId, catType, transactionalClient) {
    const displayMonths = conf.approvedDisplayMonths
    const fromDate = moment()
      .subtract(displayMonths, 'months')
      .toDate()
    try {
      const data = await formClient.getApprovedCategorisations(agencyId, fromDate, catType, transactionalClient)
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

  function isValid(formPageConfig, req, res, formUrl, userInput) {
    if (formPageConfig.validate && formPageConfig.fields) {
      const expectedFields = formPageConfig.fields.map(getFieldName)
      const inputForExpectedFields = pickBy((val, key) => expectedFields.includes(key), userInput)

      const errors = validate(inputForExpectedFields, formPageConfig)
      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        req.flash('userInput', inputForExpectedFields)
        req.flash('backLink', inputForExpectedFields)
        res.redirect(formUrl)
        return false
      }
    }
    return true
  }

  async function requiresOpenConditions(bookingId, userId, transactionalDbClient) {
    const categorisationRecord = await getCategorisationRecord(bookingId, transactionalDbClient)
    log.info(
      `Open conditions requested for booking Id: ${bookingId}, offender No: ${categorisationRecord.offenderNo}. user name: ${userId}`
    )

    const dataToStore = {
      ...categorisationRecord.formObject, // merge any existing form data
      openConditionsRequested: true,
    }
    await updateFormData(bookingId, dataToStore, transactionalDbClient)
  }

  const cancelOpenConditions = async (bookingId, userId, transactionalDbClient) => {
    const categorisationRecord = await getCategorisationRecord(bookingId, transactionalDbClient)

    const updated = Object.assign({}, categorisationRecord.formObject)
    if (categorisationRecord.catType === 'INITIAL' && updated.categoriser && updated.categoriser.provisionalCategory) {
      delete updated.categoriser.provisionalCategory
    }
    if (
      categorisationRecord.catType === 'RECAT' &&
      updated.recat &&
      updated.recat.decision &&
      (updated.recat.decision.category === 'D' || updated.recat.decision.category === 'J')
    ) {
      delete updated.recat.decision.category
      delete updated.recat.decision
    }
    updated.openConditionsRequested = false

    log.info(
      `Open conditions cancelled for booking Id: ${bookingId}, offender No: ${categorisationRecord.offenderNo}. user name: ${userId}`
    )
    await updateFormData(bookingId, updated, transactionalDbClient)
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
    backToCategoriserMessageRead,
    setAwaitingApproval,
    validate,
    isValid,
    requiresOpenConditions,
    cancelOpenConditions,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getSecurityReferredOffenders,
    isYoungOffender,
    supervisorApproval,
    deleteFormData,
    recordNomisSeqNumber,
    categoriserDecisionWithFormResponse,
    categoriserDecision,
    getCategorisationRecordUsingSequence,
    getHistoricalCategorisationRecords,
  }
}
