const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const { addSocProfile, getIn } = require('../utils/functionalHelpers')
const RiskChange = require('../utils/riskChangeStatusEnum')
const log = require('../../log')

const calculateNextReviewDate = details => {
  // Endpoint only returns the latest assessment for each type
  const cat = details.assessments.find(a => a.assessmentCode === 'CATEGORY')
  return cat && cat.nextReviewDate
}

const calculateAge21Date = details => {
  const dob = moment(details.dateOfBirth, 'YYYY-MM-DD')
  return dob.add(21, 'years').format('YYYY-MM-DD')
}

const over3YearsLeftOnSentence = details => {
  const confirmedReleaseDate = details.sentence && details.sentence.confirmedReleaseDate
  if (confirmedReleaseDate) {
    return moment(confirmedReleaseDate, 'YYYY-MM-DD').isAfter(moment().add(3, 'years'))
  }
  return false
}

const calculateDueDate = (reason, details) => {
  if (reason === 'DUE') return calculateNextReviewDate(details)
  if (reason === 'AGE') return calculateAge21Date(details)
  return null
}

module.exports = function Index({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
  riskProfilerService,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const { reason } = req.query
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      let categorisationRecord = await formService.createOrRetrieveCategorisationRecord(
        bookingId,
        req.user.username,
        details.agencyId,
        details.offenderNo,
        CatType.RECAT.name,
        reason,
        calculateDueDate(reason, details),
        transactionalDbClient
      )

      if (
        categorisationRecord.catType === CatType.INITIAL.name &&
        categorisationRecord.status !== Status.APPROVED.name
      ) {
        throw new Error('Initial categorisation is still in progress')
      }

      // If retrieved - check if APPROVED and if it is, create new
      if (categorisationRecord.status === Status.APPROVED.name) {
        categorisationRecord = await formService.createCategorisationRecord(
          bookingId,
          req.user.username,
          details.agencyId,
          details.offenderNo,
          CatType.RECAT.name,
          reason,
          calculateDueDate(reason, details),
          transactionalDbClient
        )
      }

      res.locals.formObject = categorisationRecord.formObject || {}
      res.locals.formObject = { ...res.locals.formObject, ...categorisationRecord.riskProfile }
      res.locals.formId = categorisationRecord.id

      categorisationRecord = await addSocProfile({
        res,
        req,
        riskProfilerService,
        details,
        formService,
        bookingId,
        transactionalDbClient,
        categorisationRecord,
      })

      await formService.updateStatusForOutstandingRiskChange({
        offenderNo: details.offenderNo,
        userId: req.user.username,
        transactionalClient: transactionalDbClient,
        status: RiskChange.REVIEWED_FIRST.name,
      })

      const { eligibleForFasttrack, fasttrackCancelled } = calculateFasttrackFlags(
        details,
        categorisationRecord,
        bookingId
      )
      const data = {
        details,
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        eligibleForFasttrack,
        fasttrackCancelled,
        securityReferredDate:
          categorisationRecord.securityReferredDate &&
          moment(categorisationRecord.securityReferredDate).format('DD/MM/YYYY'),
      }
      res.render('pages/tasklistRecat', { data })
    })
  )

  const calculateFasttrackFlags = (details, categorisationRecord, bookingId) => {
    const { formObject } = categorisationRecord
    const eligibleForFasttrack =
      over3YearsLeftOnSentence(details) &&
      (categorisationRecord.status === Status.STARTED.name ||
        categorisationRecord.status === Status.SUPERVISOR_BACK.name) &&
      details.categoryCode === 'C'

    const fasttrackCancelled =
      getIn(['recat', 'fasttrackRemain', 'remainCatC'], formObject) === 'No' ||
      (getIn(['recat', 'fasttrackEligibility', 'earlyCatD'], formObject) === 'Yes' ||
        getIn(['recat', 'fasttrackEligibility', 'increaseCategory'], formObject) === 'Yes')

    log.debug(
      `eligible for fast track status: ${eligibleForFasttrack} for offender no ${
        details.offenderNo
      },  booking id ${bookingId},  category: ${details.categoryCode}, status ${
        categorisationRecord.status
      }, confirmedReleaseDate: ${details.sentence && details.sentence.confirmedReleaseDate}`
    )
    if (fasttrackCancelled) {
      log.debug(
        `Fast track C was completed and cancelled for offender no ${details.offenderNo},  booking id ${bookingId}`
      )
    }
    return { eligibleForFasttrack, fasttrackCancelled }
  }

  router.get(
    '/recategoriserSubmitted/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/recategoriserSubmitted')
    })
  )

  return router
}
