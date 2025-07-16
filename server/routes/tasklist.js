const moment = require('moment')
const express = require('express')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const { addSocProfile, inProgress } = require('../utils/functionalHelpers')
const { isFemalePrisonId, add10BusinessDays } = require('../utils/utils')

module.exports = function Index({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
  riskProfilerService,
  pathfinderService,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
        transactionalDbClient,
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
          message: 'Error: This prisoner has an unapproved categorisation in the "Other categories" section',
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
          transactionalDbClient,
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
        pathfinderService,
      })

      const data = {
        details,
        isInWomensEstate: isFemalePrisonId(details.prisonId),
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        securityReferredDate:
          categorisationRecord.securityReferredDate &&
          moment(categorisationRecord.securityReferredDate).format('DD/MM/YYYY'),
      }
      return res.render('pages/tasklist', { data, backLink })
    }),
  )

  router.get(
    '/supervisor/outcome/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const catType =
        req.query.catType && req.query.catType.toLowerCase() === 'recat' ? 'supervisorRecat' : 'supervisorInitial'
      res.render('pages/supervisorReviewOutcome', {
        data: { surveyParameters: `${catType}=true&host=${req.hostname}` },
      })
    }),
  )

  router.get(
    '/images/:imageId/data',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      await offendersService.getImage(res.locals, req.params.imageId, res)
    }),
  )

  router.get(
    '/categoriserSubmitted/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/categoriserSubmitted', {
        data: { surveyParameters: `initial=true&host=${req.hostname}` },
      })
    }),
  )

  return router
}
