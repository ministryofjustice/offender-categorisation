const moment = require('moment')
const express = require('express')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { handleCsrf, redirectUsingRole } = require('../utils/routes')
const CatType = require('../utils/catTypeEnum')
const dashboard = require('../config/dashboard')
const Status = require('../utils/statusEnum')

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
  router.use(flash())

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
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUncategorisedOffenders(res.locals, user, transactionalDbClient)
        : []
      res.render('pages/categoriserHome', { offenders })
    })
  )

  router.get(
    '/categoriserDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(res.locals, user, CatType.INITIAL.name, transactionalDbClient)
        : []
      res.render('pages/categoriserDone', { offenders })
    })
  )

  router.get(
    '/supervisorDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(res.locals, user, null, transactionalDbClient)
        : []
      res.render('pages/supervisorDone', { offenders })
    })
  )

  router.get(
    '/securityDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getSecurityReviewedOffenders(res.locals, transactionalDbClient)
        : []
      res.render('pages/securityDone', { offenders })
    })
  )

  router.get(
    '/supervisorHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUnapprovedOffenders(res.locals, transactionalDbClient)
        : []
      res.render('pages/supervisorHome', { offenders })
    })
  )

  router.get(
    '/securityHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getReferredOffenders(res.locals, transactionalDbClient)
        : []
      res.render('pages/securityHome', { offenders })
    })
  )

  router.get(
    '/recategoriserHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getRecategoriseOffenders(res.locals, user, transactionalDbClient)
        : []

      const riskChangeCount = await formService.getRiskChangeCount(
        res.locals.user.activeCaseLoad.caseLoadId,
        transactionalDbClient
      )
      res.render('pages/recategoriserHome', { offenders, riskChangeCount })
    })
  )

  router.get(
    '/recategoriserDone',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getCategorisedOffenders(res.locals, user, CatType.RECAT.name, transactionalDbClient)
        : []
      const riskChangeCount = await formService.getRiskChangeCount(
        res.locals.user.activeCaseLoad.caseLoadId,
        transactionalDbClient
      )
      res.render('pages/recategoriserDone', { offenders, riskChangeCount })
    })
  )

  router.get(
    '/recategoriserCheck',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getRiskChanges(res.locals, transactionalDbClient)
        : []
      res.render('pages/recategoriserCheck', { offenders })
    })
  )

  const INIT = CatType.INITIAL.name
  const RECAT = CatType.RECAT.name

  async function getParams(req, res) {
    const { startDate, endDate, scope } = req.query
    const start = startDate ? moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD') : null
    const end = endDate ? moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD') : null
    const prisonId = scope === 'all' ? null : res.locals.user.activeCaseLoadId
    return { start, end, prisonId }
  }

  function getTotal(results) {
    return results.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0)
  }

  router.get(
    '/dashboardInitial',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const errors = formService.isValidForGet(dashboard.dashboard, req, res, req.query)
      if (errors.length) {
        res.render('pages/dashboardInitial', { errors, ...req.query })
      } else {
        const { start, end, prisonId } = await getParams(req, res)
        const initial = await statsService.getInitialCategoryOutcomes(start, end, prisonId, transactionalDbClient)
        const security = await statsService.getSecurityReferrals(INIT, start, end, prisonId, transactionalDbClient)
        const timeliness = await statsService.getTimeliness(INIT, start, end, prisonId, transactionalDbClient)
        const onTime = await statsService.getOnTime(INIT, start, end, prisonId, transactionalDbClient)
        const total = getTotal(initial)

        res.render('pages/dashboardInitial', { initial, security, timeliness, onTime, total, errors, ...req.query })
      }
    })
  )

  router.get(
    '/dashboardRecat',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const errors = formService.isValidForGet(dashboard.dashboard, req, res, req.query)
      if (errors.length) {
        res.render('pages/dashboardInitial', { errors, ...req.query })
      } else {
        const { start, end, prisonId } = await getParams(req, res)
        const table = await statsService.getRecatFromTo(start, end, prisonId, transactionalDbClient)
        const recat = await statsService.getRecatCategoryOutcomes(start, end, prisonId, transactionalDbClient)
        const security = await statsService.getSecurityReferrals(RECAT, start, end, prisonId, transactionalDbClient)
        const timeliness = await statsService.getTimeliness(RECAT, start, end, prisonId, transactionalDbClient)
        const onTime = await statsService.getOnTime(RECAT, start, end, prisonId, transactionalDbClient)
        const total = getTotal(recat)

        res.render('pages/dashboardRecat', { table, recat, security, timeliness, onTime, total, errors, ...req.query })
      }
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
          prisonDescription: await offendersService.getOptionalAssessmentAgencyDescription(res.locals, d.prisonId),
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
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const { catType } = req.query

      res.render('pages/openConditionsAdded', { data: { catType, details: { bookingId } } })
    })
  )

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

      const nextReviewDate = extractNextReviewDate(details)
      const requiredCatType = await offendersService.isRecat(res.locals, bookingId)

      const securityReferral = await getSecurityReferral(res.locals, details.offenderNo, transactionalDbClient)
      const categorisationUser = await getCategorisationUserForSecurityDisplay(res.locals, categorisationRecord)

      res.render('pages/landing', {
        data: {
          requiredCatType,
          inProgressCatType: categorisationRecord.catType,
          nextReviewDate,
          ...securityReferral,
          details,
          categorisationUser,
          status: categorisationRecord.status,
        },
      })
    })
  )

  /* we only need the categorisation user name if the categorisation is in progress and the current user has the security role */
  const getCategorisationUserForSecurityDisplay = async (context, categorisation) => {
    if (context.user.roles.security && categorisation.status && categorisation.status !== Status.APPROVED.name)
      return userService.getUserByUserId(context, categorisation.userId)
    return {}
  }

  const getSecurityReferral = async (context, offenderNo, transactionalDbClient) => {
    const securityReferral = await formService.getSecurityReferral(offenderNo, transactionalDbClient)

    const isSecurityReferred = securityReferral.status === 'NEW'

    if (isSecurityReferred) {
      const referrerCurrentUser = securityReferral.userId === context.user.username
      const referrerUser = !referrerCurrentUser
        ? await userService.getUserByUserId(context, securityReferral.userId)
        : context.user
      const prisonDescription =
        securityReferral.prisonId === context.user.activeCaseLoad.caseLoadId
          ? context.user.activeCaseLoad.description
          : referrerUser.activeCaseLoad.description
      return {
        securityReferral,
        isSecurityReferred,
        referrerUser,
        prisonDescription,
        referredDate: securityReferral.raisedDate && moment(securityReferral.raisedDate).format('DD/MM/YYYY'),
      }
    }

    return {
      isSecurityReferred,
    }
  }

  router.post(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params

      const user = await userService.getUser(res.locals)
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)

      if (req.body.landingType && req.body.landingType === 'earlyReview') {
        await offendersService.updateNextReviewDateIfRequired(res.locals, bookingId, details)
        res.redirect(`/tasklistRecat/${bookingId}?reason=MANUAL`)
      } else {
        formService.createSecurityReferral(details.agencyId, details.offenderNo, user.username, transactionalDbClient)

        res.render('pages/securityReferralSubmitted')
      }
    })
  )

  return router
}
