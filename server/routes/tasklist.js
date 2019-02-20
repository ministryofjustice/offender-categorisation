const moment = require('moment')
const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { dateConverter } = require('../utils/utils.js')
const Status = require('../utils/statusEnum')

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const { bookingId } = req.params
      const formData = await formService.getCategorisationRecord(bookingId)
      res.locals.formObject = formData.form_response || {}
      res.locals.formId = formData.id

      const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)
      const data = {
        ...details,
        ...res.locals.formObject,
        status: formData.status,
        displayStatus: formData.status && Status[formData.status].value,
        referredDate: formData.referred_date && moment(formData.referred_date).format('DD/MM/YYYY'),
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
