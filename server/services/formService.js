const moment = require('moment')
const R = require('ramda')
const { validate } = require('../utils/fieldValidation')
const logger = require('../../log')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const RiskChange = require('../utils/riskChangeStatusEnum')
const { isNilOrEmpty, pickBy, getFieldName } = require('../utils/functionalHelpers')
const { config: conf } = require('../config')
const log = require('../../log')
const { filterJsonObjectForLogging } = require('../utils/utils')
const { SUPERVISOR_DECISION_CHANGE_TO, OPEN_CONDITIONS_CATEGORIES } = require('../routes/form')

function dataIfExists(data) {
  return data.rows[0]
}

module.exports = function createFormService(formClient, formApiClientBuilder) {
  async function getCategorisationRecord(bookingId, transactionalClient = undefined) {
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

  async function getHistoricalCategorisationRecords(offenderNo, transactionalClient) {
    try {
      const data = await formClient.getHistoricalFormData(offenderNo, transactionalClient)
      return data.rows
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getCategorisationRecords(agencyId, statusList, catType, reviewReason, transactionalClient) {
    try {
      const data = await formClient.getCategorisationRecords(
        agencyId,
        statusList,
        catType,
        reviewReason,
        transactionalClient,
      )
      return data.rows
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getRiskChanges(agencyId, transactionalClient) {
    try {
      const data = await formClient.getRiskChangeByStatus(agencyId, RiskChange.NEW.name, transactionalClient)
      return data.rows
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getRiskChangeForOffender(offenderNo, transactionalClient) {
    try {
      const data = await formClient.getNewRiskChangeByOffender(offenderNo, transactionalClient)
      return dataIfExists(data)
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
    transactionalClient = undefined,
    logUpdate,
  }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const newCategorisationForm = removeFieldsThatAreNoLongerRelevant(
      buildCategorisationForm({
        formObject: currentCategorisation.formObject || {},
        fieldMap: config.fields,
        userInput,
        formSection,
        formName,
      }),
    )

    if (validateStatusIfProvided(currentCategorisation.status, status)) {
      if (logUpdate) {
        log.info(
          `Updating Categorisation for booking Id: ${bookingId}, offender No: ${
            currentCategorisation.offenderNo
          }. user name: ${currentCategorisation.userId} \nWith details ${JSON.stringify(
            filterJsonObjectForLogging(userInput),
          )}`,
        )
      }
      await formClient.update(
        newCategorisationForm,
        bookingId,
        calculateStatus(currentCategorisation.status, status),
        transactionalClient,
      )
    }
    return newCategorisationForm
  }

  function removeFieldsThatAreNoLongerRelevant(categorisationForm) {
    const newCategorisationForm = JSON.parse(JSON.stringify(categorisationForm))
    if (
      !newCategorisationForm?.supervisor?.review?.supervisorDecision.startsWith(SUPERVISOR_DECISION_CHANGE_TO) ||
      OPEN_CONDITIONS_CATEGORIES.includes(newCategorisationForm?.supervisor?.review?.supervisorOverriddenCategory)
    ) {
      delete newCategorisationForm?.supervisor?.changeCategory
      delete newCategorisationForm?.supervisor?.furtherInformation
    }
    return newCategorisationForm
  }

  async function cancel({ bookingId, offenderNo, userId, transactionalClient }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    if (validateStatusIfProvided(currentCategorisation.status, Status.CANCELLED.name)) {
      await formClient.cancel(bookingId, userId, transactionalClient)
      await formClient.setSecurityReferralNotProcessed(offenderNo, transactionalClient)
    }
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

    delete newCategorisationForm?.supervisor?.review?.supervisorDecision

    log.info(
      `Updating Categorisation for booking Id: ${bookingId}, offender No: ${
        currentCategorisation.offenderNo
      }. user name: ${currentCategorisation.userId} \nWith details ${JSON.stringify(
        filterJsonObjectForLogging(userInput),
      )}`,
    )
    if (validateStatusIfProvided(currentCategorisation.status, Status.AWAITING_APPROVAL.name)) {
      await formClient.categoriserDecisionWithFormResponse(
        newCategorisationForm,
        bookingId,
        userId,
        transactionalClient,
      )
    }
    return newCategorisationForm
  }

  async function categoriserDecision(bookingId, userId, transactionalClient) {
    log.info(`record 'awaiting_approval' for  booking Id: ${bookingId}`)
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    if (validateStatusIfProvided(currentCategorisation.status, Status.AWAITING_APPROVAL.name)) {
      await formClient.categoriserDecision(bookingId, userId, transactionalClient)
    }
  }

  async function deleteFormData({ bookingId, formSection, formName, transactionalClient }) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)

    const updatedFormObject = removeFormdata(bookingId, currentCategorisation.formObject, formSection, formName)

    if (updatedFormObject) {
      await formClient.updateFormData(bookingId, updatedFormObject, transactionalClient)
    }
  }

  function removeFormdata(bookingId, formObject, formSection, formName) {
    const updated = { ...formObject }
    if (updated[formSection]) {
      if (updated[formSection][formName]) {
        log.debug(`deleting form for booking Id: ${bookingId}, form section: ${formSection}, form name: ${formName}`)
        delete updated[formSection][formName]
        return updated
      }
    }
    log.debug(
      `Unrequired call to remove form data for booking Id: ${bookingId}, form section: ${formSection}, form name: ${formName}`,
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
    transactionalClient = undefined,
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
          filterJsonObjectForLogging(userInput),
        )}`,
      )
      await formClient.supervisorApproval(newCategorisationForm, bookingId, userId, transactionalClient)
      await formClient.setSecurityReferralStatus(currentCategorisation.offenderNo, 'COMPLETED', transactionalClient)
    }
    return newCategorisationForm
  }

  async function createCategorisationRecord(
    bookingId,
    userId,
    prisonId,
    offenderNo,
    catType,
    reviewReason,
    dueByDate,
    transactionalClient,
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
    transactionalClient,
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
        transactionalClient,
      )
      return record
    }
    return currentRecord
  }

  function recordLiteCategorisation({
    context,
    bookingId,
    sequence,
    category,
    offenderNo,
    prisonId,
    assessmentCommittee,
    assessmentComment,
    nextReviewDate,
    placementPrisonId,
    transactionalClient,
  }) {
    return formClient.recordLiteCategorisation({
      bookingId,
      sequence,
      category,
      offenderNo,
      prisonId,
      assessmentCommittee,
      assessmentComment,
      nextReviewDate,
      placementPrisonId,
      assessedBy: context.user.username,
      transactionalClient,
    })
  }

  async function getLiteCategorisation(bookingId, transactionalClient) {
    const data = await formClient.getLiteCategorisation(bookingId, transactionalClient)
    if (data.rows.length === 0) {
      return {}
    }
    const nextReviewDate = moment(data.rows[0].nextReviewDate)
    return {
      ...data.rows[0],
      displayNextReviewDate: nextReviewDate.format('DD/MM/YYYY'),
      inputNextReviewDate: nextReviewDate.format('D/M/YYYY'),
      displayCreatedDate: moment(data.rows[0].createdDate).format('DD/MM/YYYY'),
    }
  }

  async function getUnapprovedLite(prisonId, transactionalClient) {
    const data = await formClient.getUnapprovedLite(prisonId, transactionalClient)
    return data.rows
  }

  function approveLiteCategorisation({
    context,
    bookingId,
    sequence,

    approvedDate,
    supervisorCategory,
    approvedCommittee,
    nextReviewDate,
    approvedPlacement,
    approvedPlacementComment,
    approvedComment,
    approvedCategoryComment,
    transactionalClient,
  }) {
    return formClient.approveLiteCategorisation({
      bookingId,
      sequence,

      approvedDate,
      approvedBy: context.user.username,
      supervisorCategory,
      approvedCommittee,
      nextReviewDate,
      approvedPlacement,
      approvedPlacementComment,
      approvedComment,
      approvedCategoryComment,
      transactionalClient,
    })
  }

  async function deleteLiteCategorisation(bookingId, sequence, transactionalClient) {
    await formClient.deleteLiteCategorisation({ bookingId, sequence, transactionalClient })
  }

  async function createRiskChange(offenderNo, agencyId, oldProfile, newProfile, transactionalClient) {
    const newRiskChangeByOffender = await formClient.getNewRiskChangeByOffender(offenderNo, transactionalClient)
    const existingRecordOptional = dataIfExists(newRiskChangeByOffender)

    if (existingRecordOptional) {
      log.info(`createRiskChange: updating existing risk profile record for offender ${offenderNo}`)
      await formClient.mergeRiskChangeForOffender(offenderNo, newProfile, transactionalClient)
    } else {
      log.info(`createRiskChange: creating risk profile record for offender ${offenderNo}`)
      await formClient.createRiskChange({
        agencyId,
        offenderNo,
        oldProfile,
        newProfile,
        transactionalClient,
      })
    }
  }

  async function updateStatusForOutstandingRiskChange({ offenderNo, userId, status, transactionalClient }) {
    const result = await formClient.updateNewRiskChangeStatus({
      offenderNo,
      userId,
      status,
      transactionalClient,
    })
    logger.debug(
      `updateStatusForOutstandingRiskChange for offender no  ${offenderNo} Updated ${result.rowCount} records`,
    )
  }

  function createSecurityReferral(agencyId, offenderNo, userId, transactionalClient) {
    log.info(`createSecurityReferral: creating security referral record for offenderNo ${offenderNo}`)
    return formClient.createSecurityReferral({ agencyId, offenderNo, userId, transactionalClient })
  }

  function cancelSecurityReferral(offenderNo, transactionalClient) {
    log.info(`cancelSecurityReferral: cancelling security referral record for offenderNo ${offenderNo}`)
    return formClient.setSecurityReferralStatus(offenderNo, 'CANCELLED', transactionalClient)
  }

  async function getSecurityReferral(offenderNo, transactionalClient) {
    const data = await formClient.getSecurityReferral(offenderNo, transactionalClient)
    return dataIfExists(data) || {}
  }

  function buildCategorisationForm({ formObject, fieldMap, userInput, formSection, formName }) {
    const answers = fieldMap ? fieldMap.reduce(answersFromMapReducer(userInput), {}) : {}

    if (userInput.supervisorDecision && userInput.supervisorDecision.startsWith(SUPERVISOR_DECISION_CHANGE_TO)) {
      answers.supervisorOverriddenCategory = userInput.supervisorDecision.slice(-1)
    }

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

  function updatePrisonForm(bookingId, prisonId, transactionalClient) {
    return formClient.updatePrisonForm(bookingId, prisonId, transactionalClient)
  }

  function updatePrisonLite(bookingId, prisonId, transactionalClient) {
    return formClient.updatePrisonLite(bookingId, prisonId, transactionalClient)
  }

  function updatePrisonRiskChange(offenderNo, prisonId, transactionalClient) {
    return formClient.updatePrisonRiskChange(offenderNo, prisonId, transactionalClient)
  }

  function updatePrisonSecurityReferral(offenderNo, prisonId, transactionalClient) {
    return formClient.updatePrisonSecurityReferral(offenderNo, prisonId, transactionalClient)
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
      transactionalClient,
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
    const isCatBDueToPreviousCatA = data.history && data.history.catAType
    const isCatBDueToSecurity = data.ratings && data.ratings.securityBack && data.ratings.securityBack.catB === 'Yes'
    const isCatBDueToViolence =
      (data.violenceProfile && data.violenceProfile.veryHighRiskViolentOffender) || // Visor: not MVP
      (data.violenceProfile && data.violenceProfile.provisionalCategorisation === 'B') // note: Qs on page ignored (info only)
    const isCatBDueToEscape =
      // The other Q on the escape page is info only
      data.ratings && data.ratings.escapeRating && data.ratings.escapeRating.escapeCatB === 'Yes'
    const isCatBDueToExtremism =
      (data.extremismProfile && data.extremismProfile.provisionalCategorisation === 'B') ||
      (data.ratings && data.ratings.extremismRating && data.ratings.extremismRating.previousTerrorismOffences === 'Yes')
    const isCatBDueToSeriousFurtherCharges =
      data.ratings && data.ratings.furtherCharges && data.ratings.furtherCharges.furtherChargesCatB === 'Yes'
    const isCatBDueToLife = data.lifeProfile && data.lifeProfile.provisionalCategorisation === 'B'
    if (
      isCatBDueToPreviousCatA ||
      isCatBDueToSecurity ||
      isCatBDueToViolence ||
      isCatBDueToEscape ||
      isCatBDueToExtremism ||
      isCatBDueToSeriousFurtherCharges ||
      isCatBDueToLife
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

  async function referToSecurityIfRiskAssessed(
    bookingId,
    userId,
    socProfile,
    extremismProfile,
    currentStatus,
    transactionalClient,
  ) {
    if (
      (socProfile.transferToSecurity || extremismProfile.notifyRegionalCTLead) &&
      currentStatus !== Status.SECURITY_BACK.name
    ) {
      if (validateStatusIfProvided(currentStatus, Status.SECURITY_AUTO.name)) {
        await formClient.referToSecurity(bookingId, null, Status.SECURITY_AUTO.name, transactionalClient)
        return Status.SECURITY_AUTO.name
      }
    }
    return currentStatus
  }

  async function referToSecurityIfRequested(bookingId, userId, updatedFormObject, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const section =
      currentCategorisation.catType === CatType.RECAT.name ? updatedFormObject.recat : updatedFormObject.ratings
    if (section && section.securityInput && section.securityInput.securityInputNeeded === 'Yes') {
      const currentStatus = currentCategorisation.status
      if (validateStatusIfProvided(currentStatus, Status.SECURITY_MANUAL.name)) {
        await formClient.referToSecurity(bookingId, userId, Status.SECURITY_MANUAL.name, transactionalClient)
      }
    }
    return {}
  }

  /**
   * Refer to security if a new entry is present in the SECURITY_REFERRAL table
   */
  async function referToSecurityIfFlagged(bookingId, offenderNo, currentStatus, transactionalClient) {
    const securityReferral = await getSecurityReferral(offenderNo, transactionalClient)
    if (securityReferral && securityReferral.status === 'NEW') {
      if (validateStatusIfProvided(currentStatus, Status.SECURITY_FLAGGED.name)) {
        await formClient.referToSecurity(
          bookingId,
          securityReferral.userId,
          Status.SECURITY_FLAGGED.name,
          transactionalClient,
        )
        await formClient.setSecurityReferralProcessed(offenderNo, transactionalClient)
      }
    }
  }

  async function backToCategoriser(bookingId, transactionalClient) {
    const currentCategorisation = await getCategorisationRecord(bookingId, transactionalClient)
    const currentStatus = currentCategorisation.status
    if (validateStatusIfProvided(currentStatus, Status.SUPERVISOR_BACK.name)) {
      await formClient.updateStatus(bookingId, Status.SUPERVISOR_BACK.name, transactionalClient)
    }
    return R.assocPath(['status'], Status.SUPERVISOR_BACK.name, currentCategorisation)
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
          `Supervisor sent back categorisation record for : ${bookingId}, offender No: ${currentCategorisation.offenderNo}. user name: ${currentCategorisation.userId}`,
        )
      } catch (error) {
        logger.error(error)
        throw error
      }
    }
  }

  async function securityReviewed(bookingId, userId, submitted, securityReview = undefined) {
    const formApiClient = formApiClientBuilder(userId)
    try {
      const result = await formApiClient.submitSecurityReview(bookingId, submitted, securityReview)
      if (!result) {
        throw new Error('Failed to submit security review')
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getCategorisedOffenders(agencyId, catType, transactionalClient) {
    const displayMonths = conf.approvedDisplayMonths
    const fromDate = moment().subtract(displayMonths, 'months').toDate()
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
        [Status.SECURITY_MANUAL.name, Status.SECURITY_AUTO.name, Status.SECURITY_FLAGGED.name],
        transactionalClient,
      )

      return data.rows || []
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  async function getSecurityReferrals(agencyId, transactionalClient) {
    try {
      const data = await formClient.getSecurityReferrals(agencyId, transactionalClient)

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
    const valid = proposed ? Status[proposed].previous.includes(Status[current]) : true
    if (!valid) {
      if (current === proposed) {
        logger.warn(`Cannot transition from status ${current} to itself`)
      } else {
        const error = new Error(`Cannot transition from status ${current} to ${proposed}`)
        logger.error(error)
        throw error
      }
    }
    return valid
  }

  function getInputForExpectedFields(formPageConfig, userInput) {
    const expectedFields = formPageConfig.fields.map(getFieldName)
    return pickBy((val, key) => expectedFields.includes(key), userInput)
  }

  function isValid(formPageConfig, req, res, formUrl, userInput) {
    if (formPageConfig.validate && formPageConfig.fields) {
      const inputForExpectedFields = getInputForExpectedFields(formPageConfig, userInput)
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

  function isValidForGet(formPageConfig, req, res, userInput) {
    if (formPageConfig.validate && formPageConfig.fields) {
      const inputForExpectedFields = getInputForExpectedFields(formPageConfig, userInput)
      const errors = validate(inputForExpectedFields, formPageConfig)
      return errors
    }
    return []
  }

  async function requiresOpenConditions(bookingId, userId, transactionalDbClient) {
    const categorisationRecord = await getCategorisationRecord(bookingId, transactionalDbClient)
    log.info(
      `Open conditions requested for booking Id: ${bookingId}, offender No: ${categorisationRecord.offenderNo}. user name: ${userId}`,
    )

    const dataToStore = {
      ...categorisationRecord.formObject, // merge any existing form data
      openConditionsRequested: true,
    }
    await updateFormData(bookingId, dataToStore, transactionalDbClient)
  }

  const cancelOpenConditions = async (bookingId, userId, transactionalDbClient) => {
    const categorisationRecord = await getCategorisationRecord(bookingId, transactionalDbClient)

    const updated = { ...categorisationRecord.formObject }
    if (categorisationRecord.catType === 'INITIAL' && updated.categoriser && updated.categoriser.provisionalCategory) {
      delete updated.categoriser.provisionalCategory
    }
    if (
      categorisationRecord.catType === 'RECAT' &&
      updated.recat &&
      updated.recat.decision &&
      (updated.recat.decision.category === 'D' ||
        updated.recat.decision.category === 'J' ||
        updated.recat.decision.category === 'T')
    ) {
      delete updated.recat.decision.category
      delete updated.recat.decision
    }

    delete updated.openConditions

    updated.openConditionsRequested = false

    log.info(
      `Open conditions cancelled for booking Id: ${bookingId}, offender No: ${categorisationRecord.offenderNo}. user name: ${userId}`,
    )
    await updateFormData(bookingId, updated, transactionalDbClient)
  }

  async function getRiskChangeCount(agencyId, transactionalDbClient) {
    try {
      const changesFromDB = await getRiskChanges(agencyId, transactionalDbClient)
      return isNilOrEmpty(changesFromDB) ? 0 : changesFromDB.length
    } catch (error) {
      logger.error(error, 'Error during getRiskChangeCount')
      throw error
    }
  }

  async function updateOffenderIdentifierReturningBookingId(oldOffenderNo, newOffenderNo, transactionalClient) {
    const result1 = await formClient.updateOffenderIdentifierReturningBookingIdForm(
      oldOffenderNo,
      newOffenderNo,
      transactionalClient,
    )
    logger.info(`Merge: updateOffenderIdentifierReturningBookingIdForm: rows updated = ${result1.rowCount}`)

    const result2 = await formClient.updateOffenderIdentifierReturningBookingIdLite(
      oldOffenderNo,
      newOffenderNo,
      transactionalClient,
    )
    logger.info(`Merge: updateOffenderIdentifierReturningBookingIdLite: rows updated = ${result2.rowCount}`)

    const result3 = await formClient.updateOffenderIdentifierRiskChange(
      oldOffenderNo,
      newOffenderNo,
      transactionalClient,
    )
    logger.info(`Merge: updateOffenderIdentifierRiskChange: rows updated = ${result3.rowCount}`)

    const securityReferralRemove = await getSecurityReferral(oldOffenderNo, transactionalClient)
    const securityReferralSurvives = await getSecurityReferral(newOffenderNo, transactionalClient)

    // If row for surviving offenderNo exists, or to-be-removed offenderNo exists, use that.
    // If both exist, use whichever is not in COMPLETED status
    // If neither COMPLETED, use the later raisedDate
    // If both COMPLETED, do nothing.
    // NOTE no need to delete the removed record when not used.

    const exists = record => !!record.status

    const isComplete = referral => referral.status === 'COMPLETED' || referral.status === 'CANCELLED'

    if (exists(securityReferralRemove)) {
      if (exists(securityReferralSurvives)) {
        if (!isComplete(securityReferralRemove)) {
          if (
            isComplete(securityReferralSurvives) ||
            securityReferralRemove.raisedDate > securityReferralSurvives.raisedDate
          ) {
            // choose data of removed over survivor
            const result5 = await formClient.deleteSecurityReferral(newOffenderNo, transactionalClient)
            logger.info(`Merge: deleteSecurityReferral: rows updated = ${result5.rowCount}`)

            const result4 = await formClient.updateOffenderIdentifierSecurityReferral(
              oldOffenderNo,
              newOffenderNo,
              transactionalClient,
            )
            logger.info(`Merge: updateOffenderIdentifierSecurityReferral: rows updated = ${result4.rowCount}`)
          }
          // .. otherwise use survivor
        }
      } else {
        const result4 = await formClient.updateOffenderIdentifierSecurityReferral(
          oldOffenderNo,
          newOffenderNo,
          transactionalClient,
        )
        logger.info(`Merge: updateOffenderIdentifierSecurityReferral: rows updated = ${result4.rowCount}`)
      }
    }

    return { formRows: result1.rows, liteRows: result2.rows }
  }

  function recordNextReview(context, { bookingId, offenderNo, nextReviewDate, reason }, transactionalClient) {
    return formClient.recordNextReview({
      bookingId,
      offenderNo,
      nextReviewDate,
      reason,
      user: context.user.username,
      transactionalClient,
    })
  }

  async function getNextReview(offenderNo, transactionalClient) {
    const data = await formClient.getNextReview(offenderNo, transactionalClient)
    return data.rows
  }

  async function deletePendingCategorisations(offenderNo, transactionalClient) {
    const [pendingCategorisations, pendingLiteCategorisations] = await Promise.all([
      formClient.getPendingCategorisations(offenderNo, transactionalClient),
      formClient.getPendingLiteCategorisations(offenderNo, transactionalClient),
    ])

    if (conf.featureFlags.events.offender_release.enable_pending_categorisation_deletion === 'true') {
      await Promise.all(
        pendingCategorisations.rows.map(async pendingCategorisation =>
          formClient.deleteCategorisation(pendingCategorisation.id, transactionalClient),
        ),
      )

      await Promise.all(
        pendingLiteCategorisations.rows.map(async pendingLiteCategorisation =>
          formClient.deleteLiteCategorisation({
            bookingId: pendingLiteCategorisation.booking_id,
            sequence: pendingLiteCategorisation.sequence,
            transactionalClient,
          }),
        ),
      )
    } else {
      logger.debug('Would have deleted the following pending categorisations', {
        offenderNo,
        categorisationIds: pendingCategorisations.rows.map(pendingCategorisation => pendingCategorisation.id),
      })

      const liteCatsToDelete = pendingLiteCategorisations.rows.map(pendingLiteCategorisation => ({
        booking_id: pendingLiteCategorisation.booking_id,
        sequence: pendingLiteCategorisation.sequence,
      }))
      logger.debug('Would have deleted the following pending lite_categorisations', {
        offenderNo,
        liteCatsToDelete,
      })
    }
  }

  return {
    getCategorisationRecord,
    update,
    updateFormData,
    cancel,
    mergeRiskProfileData,
    computeSuggestedCat,
    referToSecurityIfRiskAssessed,
    referToSecurityIfRequested,
    referToSecurityIfFlagged,
    securityReviewed,
    validateStatusIfProvided,
    createOrRetrieveCategorisationRecord,
    createCategorisationRecord,
    recordLiteCategorisation,
    getLiteCategorisation,
    getUnapprovedLite,
    approveLiteCategorisation,
    deleteLiteCategorisation,
    backToCategoriser,
    backToCategoriserMessageRead,
    setAwaitingApproval,
    isValid,
    isValidForGet,
    requiresOpenConditions,
    cancelOpenConditions,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getSecurityReferredOffenders,
    getSecurityReferrals,
    isYoungOffender,
    supervisorApproval,
    deleteFormData,
    updatePrisonForm,
    updatePrisonLite,
    updatePrisonRiskChange,
    updatePrisonSecurityReferral,
    recordNomisSeqNumber,
    categoriserDecisionWithFormResponse,
    categoriserDecision,
    getCategorisationRecordUsingSequence,
    getRiskChanges,
    createRiskChange,
    createSecurityReferral,
    cancelSecurityReferral,
    getSecurityReferral,
    getRiskChangeForOffender,
    getHistoricalCategorisationRecords,
    getCategorisationRecords,
    updateStatusForOutstandingRiskChange,
    getRiskChangeCount,
    updateOffenderIdentifierReturningBookingId,
    recordNextReview,
    getNextReview,
    deletePendingCategorisations,
  }
}
