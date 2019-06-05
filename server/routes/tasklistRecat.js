const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const { addSocProfile } = require('../utils/functionalHelpers')

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
      let categorisationRecord = await formService.createOrRetrieveCategorisationRecord(
        bookingId,
        req.user.username,
        details.agencyId,
        details.offenderNo,
        CatType.RECAT.name,
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

      const data = {
        details,
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        securityReferredDate:
          categorisationRecord.securityReferredDate &&
          moment(categorisationRecord.securityReferredDate).format('DD/MM/YYYY'),
      }
      res.render('pages/tasklistRecat', { data })
    })
  )

  router.get(
    '/recategoriserSubmitted/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      res.render('pages/recategoriserSubmitted')
    })
  )

  return router
}
