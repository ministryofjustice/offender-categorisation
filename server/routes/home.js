const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { redirectUsingRole } = require('../utils/routes')

module.exports = function Index({ authenticationMiddleware, userService, offendersService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      redirectUsingRole(res, '/categoriserHome', '/supervisorHome', '/securityHome')
    })
  )

  router.get(
    '/categoriserHome',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUncategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user
          )
        : []
      res.render('pages/categoriserHome', { offenders })
    })
  )

  router.get(
    '/categoriserDone',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user
          )
        : []
      res.render('pages/categoriserDone', { offenders })
    })
  )

  router.get(
    '/supervisorDone',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user
          )
        : []
      res.render('pages/supervisorDone', { offenders })
    })
  )

  router.get(
    '/securityDone',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getSecurityReviewedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId
          )
        : []
      res.render('pages/securityDone', { offenders })
    })
  )

  router.get(
    '/supervisorHome',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUnapprovedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId
          )
        : []
      res.render('pages/supervisorHome', { offenders })
    })
  )

  router.get(
    '/securityHome',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getReferredOffenders(res.locals.user.token, res.locals.user.activeCaseLoad.caseLoadId)
        : []
      res.render('pages/securityHome', { offenders })
    })
  )

  return router
}
