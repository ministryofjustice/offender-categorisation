const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const ReviewReason = require('../utils/reviewReasonEnum')
const { addSocProfile, isFirstVisit, inProgress } = require('../utils/functionalHelpers')
const { get10BusinessDays } = require('../utils/utils.js')

function add10BusinessDays(isoDate) {
  const sentenceDateMoment = moment(isoDate, 'YYYY-MM-DD')
  const numberOfDays = get10BusinessDays(sentenceDateMoment)
  return sentenceDateMoment.add(numberOfDays, 'day').format('YYYY-MM-DD')
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
      const dueByDate =
        details.sentence && details.sentence.sentenceStartDate && add10BusinessDays(details.sentence.sentenceStartDate)

      let categorisationRecord = await formService.createOrRetrieveCategorisationRecord(
        bookingId,
        req.user.username,
        details.agencyId,
        details.offenderNo,
        CatType.INITIAL.name,
        reason || null,
        dueByDate,
        transactionalDbClient
      )
      const backLink = req.get('Referrer')

      if (categorisationRecord.catType === CatType.RECAT.name && inProgress(categorisationRecord)) {
        await transactionalDbClient.query('ROLLBACK')
        return res.render('pages/error', {
          message: 'Error: A categorisation review is in progress',
          backLink,
        })
      }

      const assessmentData = await formService.getLiteCategorisation(bookingId, transactionalDbClient)
      const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
      if (liteInProgress) {
        await transactionalDbClient.query('ROLLBACK')
        return res.render('pages/error', {
          message: 'Error: There is an unapproved categorisation in the "other categories" section',
          backLink,
        })
      }

      // If retrieved - check if APPROVED and if it is, create new
      if (categorisationRecord.status === Status.APPROVED.name) {
        categorisationRecord = await formService.createCategorisationRecord(
          bookingId,
          req.user.username,
          details.agencyId,
          details.offenderNo,
          CatType.INITIAL.name,
          reason || null,
          dueByDate,
          transactionalDbClient
        )
      }

      res.locals.formObject = categorisationRecord.formObject || {}
      res.locals.formObject = { ...res.locals.formObject, ...categorisationRecord.riskProfile }
      res.locals.formId = categorisationRecord.id

      if (reason === ReviewReason.MANUAL.name && isFirstVisit(res)) {
        // Ensure this categorisation appears on the to-do list
        await offendersService.setInactive(res.locals, bookingId, 'ACTIVE') // TODO suppose we then cancel !!!???
      }

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

      const data = {
        details,
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        securityReferredDate:
          categorisationRecord.securityReferredDate &&
          moment(categorisationRecord.securityReferredDate).format('DD/MM/YYYY'),
      }
      return res.render('pages/tasklist', { data, backLink })
    })
  )

  router.get(
    '/categoriserSubmitted/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/categoriserSubmitted')
    })
  )

  router.get(
    '/supervisor/outcome/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/supervisorReviewOutcome')
    })
  )

  router.get(
    '/images/:imageId/data',
    asyncMiddleware(async (req, res) => {
      await offendersService.getImage(res.locals, req.params.imageId, res)
    })
  )

  return router
}
