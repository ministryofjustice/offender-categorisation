const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const logger = require('../../log.js')

module.exports = function Index({ offendersService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      logger.debug('GET /offendersInPrison')
      const offenders = await offendersService.getOffendersInPrison(
        res.locals.user,
        'LEI' // todo replace with current agency
      )
      res.render('pages/offendersInPrison', { offenders })
    })
  )

  return router
}
