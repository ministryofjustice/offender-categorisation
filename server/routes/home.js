const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware, userService, offendersService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user.activeCaseLoad = user.activeCaseLoad

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUncategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId
          )
        : []

      res.render('pages/index', { offenders })
    })
  )

  return router
}
