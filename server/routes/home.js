const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const jwtDecode = require('jwt-decode')

module.exports = function Index({ authenticationMiddleware, userService, offendersService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      const roles = jwtDecode(res.locals.user.token).authorities

      if (roles.includes('ROLE_APPROVE_CATEGORISATION')) {
        res.redirect('/supervisorHome')
      } else if (roles.includes('ROLE_CREATE_CATEGORISATION')) {
        res.redirect('/categoriserHome')
      } else if (roles.includes('ROLE_CATEGORISATION_SECURITY')) {
        res.redirect('/securityHome')
      } else {
        // go to a 'not auth' page?
        res.status(403)
        res.end('User does not have any categorisation tool roles')
      }
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
