const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const { addSocProfile } = require('../utils/functionalHelpers')
const { get10BusinessDays } = require('../utils/utils.js')
const logger = require('../../log.js')

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
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)
      const dueByDate =
        details.sentence && details.sentence.sentenceStartDate && add10BusinessDays(details.sentence.sentenceStartDate)

      let categorisationRecord = await formService.createOrRetrieveCategorisationRecord(
        bookingId,
        req.user.username,
        details.agencyId,
        details.offenderNo,
        CatType.INITIAL.name,
        null,
        dueByDate,
        transactionalDbClient
      )
      if (categorisationRecord.status === Status.APPROVED.name) {
        logger.error(
          `tasklist: Attempt to do initial cat for $bookingId / $categorisationRecord.offenderNo where approved cat already exists`
        )
        throw new Error(
          'An approved categorisation already exists for this prison term. This prisoner can only be recategorised.'
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

      const data = {
        details,
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        securityReferredDate:
          categorisationRecord.securityReferredDate &&
          moment(categorisationRecord.securityReferredDate).format('DD/MM/YYYY'),
      }
      res.render('pages/tasklist', { data })
    })
  )

  router.get(
    '/categoriserSubmitted/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/categoriserSubmitted')
    })
  )

  router.get(
    '/supervisor/outcome/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/supervisorReviewOutcome')
    })
  )

  router.get(
    '/images/:imageId/data',
    asyncMiddleware(async (req, res) => {
      await offendersService.getImage(res.locals.user.token, req.params.imageId, res)
    })
  )

  return router
}
