const express = require('express')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const moment = require('moment')

module.exports = function Index({ formService, offendersService, authenticationMiddleware }) {
  const router = express.Router()
  const dateConverter = from => from && moment(from, 'YYYY-MM-DD').format('DD/MM/YYYY')

  router.use(authenticationMiddleware())
  router.use(getFormData(formService))

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res) => {
      const details = await offendersService.getOffenderDetails(res.locals.user.token, req.params.bookingId)
      res.render('pages/tasklist', { data: { ...details, ...res.locals.formObject }, dateConverter })
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
