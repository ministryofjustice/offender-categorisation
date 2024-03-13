const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { initApiAuth, apiAuthenticationMiddleware } = require('../authentication/apiAuth')
const authorisationMiddleware = require('../middleware/authorisationMiddleware')

const ERROR = {
  REQUIRED_QUERY_PARAMS:
    'Either NOMIS Prison Number (PRN) or nDelius Case Reference Number (CRN) must be provided as part of the request.',
}

module.exports = function SubjectAccessRequest({ subjectAccessRequestService, userService, offendersService }) {
  const router = express.Router()

  initApiAuth()
  router.use(apiAuthenticationMiddleware())

  router.get(
    '/',
    [
      (req, res, next) => {
        res.locals.user = {
          token: req.headers.authorization.replace('Bearer', '').trim(),
        }
        return next()
      },
      authorisationMiddleware(userService, offendersService),
    ],
    asyncMiddleware(async (req, res) => {
      const { prn, crn } = req.query

      if (!prn && !crn) {
        res.status(400)
        return res.json({
          developerMessage: ERROR.REQUIRED_QUERY_PARAMS,
          errorCode: 400,
          status: 400,
          userMessage: ERROR.REQUIRED_QUERY_PARAMS,
        })
      }

      if (!prn && crn) {
        res.status(209)
        return res.json([])
      }

      return res.json({
        hello: 'world',
      })
    })
  )

  return router
}
