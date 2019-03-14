const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { dateConverter } = require('../utils/utils.js')
const Status = require('../utils/statusEnum')

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
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)
      let categorisationRecord = await formService.createOrRetrieveCategorisationRecord(
        bookingId,
        req.user.username,
        details.agencyId,
        details.offenderNo
      )
      res.locals.formObject = categorisationRecord.form_response || {}
      res.locals.formId = categorisationRecord.id

      // only load the soc profile once - then it is saved against the record
      if (!res.locals.formObject.socProfile) {
        const socProfile = await riskProfilerService.getSecurityProfile(details.offenderNo, res.locals.user.username)
        const dataToStore = {
          ...res.locals.formObject, // merge any existing form data
          socProfile,
        }
        await formService.updateFormData(bookingId, dataToStore)

        await formService.referToSecurityIfRiskAssessed(
          bookingId,
          req.user.username,
          socProfile,
          categorisationRecord.status
        )
        categorisationRecord = await formService.getCategorisationRecord(bookingId)
      }

      const data = {
        details,
        ...res.locals.formObject,
        status: categorisationRecord.status,
        displayStatus: categorisationRecord.status && Status[categorisationRecord.status].value,
        referredDate:
          categorisationRecord.referred_date && moment(categorisationRecord.referred_date).format('DD/MM/YYYY'),
      }
      res.render('pages/tasklist', { data, dateConverter, Status })
    })
  )

  router.get(
    '/categoriserSubmitted/:bookingId',
    asyncMiddleware(async (req, res) => {
      res.render('pages/categoriserSubmitted')
    })
  )

  router.get(
    '/supervisor/outcome/:bookingId',
    asyncMiddleware(async (req, res) => {
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
