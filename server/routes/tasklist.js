const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { dateConverter } = require('../utils/utils.js')

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
      res.render('pages/tasklist', { data: { ...details, ...res.locals.formObject }, dateConverter })
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
