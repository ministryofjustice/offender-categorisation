const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { handleCsrf, redirectUsingRole } = require('../utils/routes')
const CatType = require('../utils/catTypeEnum')

const extractNextReviewDate = details => {
  const catRecord = details && details.assessments && details.assessments.find(a => a.assessmentCode === 'CATEGORY')
  return catRecord && catRecord.nextReviewDate
}

module.exports = function Index({
  authenticationMiddleware,
  userService,
  offendersService,
  statsService,
  formService,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())

  router.use(handleCsrf)

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      redirectUsingRole(req, res, '/categoriserHome', '/supervisorHome', '/securityHome', '/recategoriserHome')
    })
  )

  router.get(
    '/categoriserHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUncategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user,
            transactionalDbClient
          )
        : []
      res.render('pages/categoriserHome', { offenders })
    })
  )

  router.get(
    '/categoriserDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user,
            CatType.INITIAL.name,
            transactionalDbClient
          )
        : []
      res.render('pages/categoriserDone', { offenders })
    })
  )

  router.get(
    '/supervisorDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user,
            null,
            transactionalDbClient
          )
        : []
      res.render('pages/supervisorDone', { offenders })
    })
  )

  router.get(
    '/securityDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getSecurityReviewedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            transactionalDbClient
          )
        : []
      res.render('pages/securityDone', { offenders })
    })
  )

  router.get(
    '/supervisorHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUnapprovedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            transactionalDbClient
          )
        : []
      res.render('pages/supervisorHome', { offenders })
    })
  )

  router.get(
    '/securityHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getReferredOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            transactionalDbClient
          )
        : []
      res.render('pages/securityHome', { offenders })
    })
  )

  router.get(
    '/recategoriserHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getRecategoriseOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user,
            transactionalDbClient
          )
        : []
      res.render('pages/recategoriserHome', { offenders })
    })
  )

  router.get(
    '/recategoriserDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            user,
            CatType.RECAT.name,
            transactionalDbClient
          )
        : []
      res.render('pages/recategoriserDone', { offenders })
    })
  )

  router.get(
    '/recategoriserCheck',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getRiskChanges(
            res.locals.user.token,
            res.locals.user.activeCaseLoad.caseLoadId,
            transactionalDbClient
          )
        : []
      res.render('pages/recategoriserCheck', { offenders })
    })
  )

  router.get(
    '/dashboard',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const initial = await statsService.getInitialCategoryOutcomes(transactionalDbClient)
      const recat = await statsService.getRecatCategoryOutcomes(transactionalDbClient)
      const security = await statsService.getSecurityReferrals(transactionalDbClient)
      const timeliness = await statsService.getTimeliness(transactionalDbClient)

      res.render('pages/dashboard', { initial, recat, security, timeliness })
    })
  )

  router.get(
    '/categoryHistory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const data = await formService.getHistoricalCategorisationRecords(bookingId, transactionalDbClient)
      const dataDecorated = await Promise.all(
        data.map(async d => ({
          ...d,
          prisonDescription: await offendersService.getOptionalAssessmentAgencyDescription(
            res.locals.user.token,
            d.prisonId
          ),
        }))
      )
      res.render(`pages/categoryHistory`, { data: dataDecorated })
    })
  )

  router.get(
    '/switchRole/:role',
    asyncMiddleware(async (req, res) => {
      const { role } = req.params

      req.session.currentRole = role
      res.locals.currentRole = role

      res.redirect('/')
    })
  )

  router.get(
    '/openConditionsAdded/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const { catType } = req.query

      res.render('pages/openConditionsAdded', { data: { catType, details: { bookingId } } })
    })
  )

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals.user.token)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)

      const nextReviewDate = extractNextReviewDate(details)
      const catType = await offendersService.isRecat(res.locals.user.token, bookingId)
      const securityReferral = await formService.getSecurityReferral(details.offenderNo, transactionalDbClient)
      const isSecurityReferred = securityReferral.status === 'NEW'

      res.render('pages/landing', { data: { catType, nextReviewDate, isSecurityReferred, details } })
    })
  )

  router.post(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params

      const user = await userService.getUser(res.locals.user.token)
      const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)

      if (req.body.landingType && req.body.landingType === 'earlyReview') {
        await offendersService.updateNextReviewDateIfRequired(res.locals.user.token, bookingId, details)
        res.redirect(`/tasklistRecat/${bookingId}?reason=MANUAL`)
      } else {
        formService.createSecurityReferral(details.agencyId, details.offenderNo, user.username, transactionalDbClient)

        res.render('pages/securityReferralSubmitted')
      }
    })
  )

  return router
}
