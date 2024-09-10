const moment = require('moment')
const express = require('express')
const flash = require('connect-flash')
const joi = require('joi')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { handleCsrf, redirectUsingRole } = require('../utils/routes')
const CatType = require('../utils/catTypeEnum')
const dashboard = require('../config/dashboard')
const { inProgress, extractNextReviewDate } = require('../utils/functionalHelpers')
const { dateConverterToISO, isOpenCategory } = require('../utils/utils')
const securityConfig = require('../config/security')
const StatsType = require('../utils/statsTypeEnum')
const conf = require('../config')
const logger = require('../../log')
const { recategorisationHomeFilters } = require('../services/recategorisationFilter')

const formConfig = {
  security: securityConfig,
}

const recategorisationHomeSchemaFilters = {}
Object.keys(recategorisationHomeFilters).forEach(key => {
  recategorisationHomeSchemaFilters[key] = joi
    .array()
    .items(
      joi
        .string()
        .valid(...Object.keys(recategorisationHomeFilters[key]))
        .required()
    )
    .optional()
})
const recategorisationHomeSchema = joi.object(recategorisationHomeSchemaFilters).optional()

const calculateLandingTarget = referer => {
  const pathname = referer && new URL(referer).pathname
  if (!pathname || !pathname.includes('Landing/')) {
    return '/'
  }
  const index = pathname.lastIndexOf('/')
  if (index < 0) {
    return '/'
  }
  return pathname.substring(index)
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
    '/securityUpcoming',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const offenders = res.locals.user.activeCaseLoad
        ? await offendersService.getUpcomingReferredOffenders(res.locals, transactionalDbClient)
        : []
      res.render('pages/securityUpcoming', { offenders })
    })
  )

  router.get(
    '/recategoriserHome',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const validation = recategorisationHomeSchema.validate(req.query, { stripUnknown: true, abortEarly: false })
      if (validation.error) {
        logger.error('Recategoriser home page submitted with invalid filters.', validation.error)
        return res.render('pages/error', {
          message: 'Invalid recategoriser home filters',
        })
      }

      let showRecategorisationPrioritisationFilter = false
      if (conf.featureFlags.recategorisationPrioritisation.show_filter === 'true') {
        showRecategorisationPrioritisationFilter = true
      }

      const offenders = user.activeCaseLoad
        ? await offendersService.getRecategoriseOffenders(res.locals, user, transactionalDbClient, validation.value)
        : []

      const riskChangeCount = await formService.getRiskChangeCount(
        res.locals.user.activeCaseLoad.caseLoadId,
        transactionalDbClient
      )

      return res.render('pages/recategoriserHome', {
        offenders,
        riskChangeCount,
        showRecategorisationPrioritisationFilter,
        filters: validation.value,
        allFilters: recategorisationHomeFilters,
        fullUrl: req.url,
        hideRecategoriserHomeFilter: req.session.hideRecategoriserHomeFilter ?? false,
      })
    })
  )

  router.post(
    '/recategoriserHome/hide-filter',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const validation = joi.object({ hideFilter: joi.bool().required() }).validate(req.body)
      if (validation.error) {
        logger.error('Recategoriser home page hide filter endpoint passed invalid value.', validation.error)
        res.sendStatus(400)
        return
      }
      req.session.hideRecategoriserHomeFilter = validation.value.hideFilter
      res.sendStatus(200)
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
    const start = startDate ? dateConverterToISO(startDate) : null
    const end = endDate ? dateConverterToISO(endDate) : null
    let prisonId
    if (scope === 'all' && res.locals.user.activeCaseLoad.female) {
      prisonId = StatsType.FEMALE
    } else if (scope === 'all' && !res.locals.user.activeCaseLoad.female) {
      prisonId = StatsType.MALE
    } else {
      prisonId = res.locals.user.activeCaseLoadId
    }
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
        const timeline = await statsService.getTimeline(INIT, start, end, prisonId, transactionalDbClient)
        const onTime = await statsService.getOnTime(INIT, start, end, prisonId, transactionalDbClient)
        const tprs = await statsService.getTprsTotals(INIT, start, end, prisonId, transactionalDbClient)
        const total = getTotal(initial)
        const scopeValues = [
          user.activeCaseLoad.description,
          user.activeCaseLoad.female ? StatsType.FEMALE.value : StatsType.MALE.value,
        ]

        res.render('pages/dashboardInitial', {
          scopeValues,
          initial,
          security,
          timeline,
          onTime,
          tprs,
          total,
          errors,
          ...req.query,
          catType: CatType.INITIAL.name,
        })
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
        res.render('pages/dashboardRecat', { errors, ...req.query })
      } else {
        const { start, end, prisonId } = await getParams(req, res)
        const table = await statsService.getRecatFromTo(
          start,
          end,
          prisonId,
          transactionalDbClient,
          user.activeCaseLoad.female
        )
        const recat = await statsService.getRecatCategoryOutcomes(start, end, prisonId, transactionalDbClient)
        const security = await statsService.getSecurityReferrals(RECAT, start, end, prisonId, transactionalDbClient)
        const timeline = await statsService.getTimeline(RECAT, start, end, prisonId, transactionalDbClient)
        const onTime = await statsService.getOnTime(RECAT, start, end, prisonId, transactionalDbClient)
        const tprs = await statsService.getTprsTotals(RECAT, start, end, prisonId, transactionalDbClient)
        const total = getTotal(recat)
        const scopeValues = [
          user.activeCaseLoad.description,
          user.activeCaseLoad.female ? StatsType.FEMALE.value : StatsType.MALE.value,
        ]

        res.render('pages/dashboardRecat', {
          scopeValues,
          table,
          recat,
          security,
          timeline,
          onTime,
          tprs,
          total,
          errors,
          ...req.query,
          catType: CatType.RECAT.name,
        })
      }
    })
  )

  router.get(
    '/categoryHistory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const data = await offendersService.getCategoryHistory(res.locals, bookingId, transactionalDbClient)
      res.render(`pages/categoryHistory`, { data })
    })
  )

  router.get(
    '/switchRole/:role',
    asyncMiddleware(async (req, res) => {
      const { role } = req.params
      const { referer } = req.headers

      req.session.currentRole = role
      res.locals.currentRole = role

      res.redirect(calculateLandingTarget(referer))
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
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      redirectUsingRole(
        req,
        res,
        `/categoriserLanding/${bookingId}`,
        `/supervisorLanding/${bookingId}`,
        `/securityLanding/${bookingId}`,
        `/recategoriserLanding/${bookingId}`,
        `/landing/${bookingId}`
      )
    })
  )

  router.get(
    '/:role(categoriser|supervisor|security|recategoriser)Landing/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { role, bookingId } = req.params
      const [details, categorisationRecord] = await Promise.all([
        offendersService.getOffenderDetails(res.locals, bookingId),
        formService.getCategorisationRecord(bookingId, transactionalDbClient),
      ])

      const [securityReferral, categorisationUser, categoryHistory] = await Promise.all([
        getSecurityReferral(res.locals, details.offenderNo, transactionalDbClient),
        getCategorisationUserForSecurityDisplay(res.locals, categorisationRecord),
        offendersService.getCategoryHistory(res.locals, bookingId, transactionalDbClient),
      ])

      const nextReviewDate = extractNextReviewDate(details)
      const requiredCatType = offendersService.requiredCatType(
        parseInt(bookingId, 10),
        details.categoryCode,
        categoryHistory.history
      )

      const nextReviewDateHistory = await formService.getNextReview(details.offenderNo, transactionalDbClient)
      const firstRecord = categoryHistory?.history.length > 0 && categoryHistory.history[0]
      res.render(`pages/${role}Landing`, {
        data: {
          requiredCatType,
          inProgressCatType: categorisationRecord.catType,
          nextReviewDate,
          ...securityReferral,
          details,
          categorisationUser,
          status: categorisationRecord.status,
          hasTprsSelected: (firstRecord?.tprsSelected && isOpenCategory(firstRecord?.classificationCode)) || false,
          tprsDate: firstRecord?.tprsSelected ? firstRecord.approvalDate : '',
          nextReviewDateHistory,
        },
      })
    })
  )

  router.get(
    '/landing/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const nextReviewDate = extractNextReviewDate(details)

      res.render(`pages/landing`, { data: { details, nextReviewDate } })
    })
  )

  /* we only need the categorisation user name if the categorisation is in progress and the current user has the security role */
  const getCategorisationUserForSecurityDisplay = async (context, categorisation) => {
    if (context.user.roles.security && inProgress(categorisation))
      return userService.getUserByUserId(context, categorisation.userId)
    return {}
  }

  const getSecurityReferral = async (context, offenderNo, transactionalDbClient) => {
    const securityReferral = await formService.getSecurityReferral(offenderNo, transactionalDbClient)

    const isSecurityReferred = securityReferral.status === 'NEW'

    if (isSecurityReferred) {
      const isReferrerCurrentUser = securityReferral.userId === context.user.username
      const referrerUser = !isReferrerCurrentUser
        ? await userService.getUserByUserId(context, securityReferral.userId)
        : context.user
      const prisonDescription =
        securityReferral.prisonId === context.user.activeCaseLoad.caseLoadId
          ? context.user.activeCaseLoad.description
          : await offendersService.getOptionalAssessmentAgencyDescription(context, securityReferral.prisonId)
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
    '/recategoriserLanding/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      res.redirect(`/tasklistRecat/${bookingId}?reason=MANUAL`)
    })
  )

  router.post(
    '/securityLanding/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params

      const user = await userService.getUser(res.locals)
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)

      // ensure cat not in progress.
      const assessmentData = await formService.getLiteCategorisation(bookingId, transactionalDbClient)
      const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
      const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
      if (liteInProgress || inProgress(categorisationRecord)) {
        const backLink = req.get('Referrer')
        return res.render('pages/error', {
          message: 'Error: A categorisation is already in progress',
          backLink,
        })
      }

      await formService.createSecurityReferral(
        details.agencyId,
        details.offenderNo,
        user.username,
        transactionalDbClient
      )
      return res.render('pages/securityReferralSubmitted', { bookingId })
    })
  )

  router.get(
    '/securityLanding/cancel/:bookingId',
    asyncMiddleware(async (req, res) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const errors = req.flash('errors')
      res.render(`pages/securityCancel`, { data: { details }, errors })
    })
  )

  router.post(
    '/securityLanding/cancel/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const formPageConfig = formConfig.security.cancel

      const valid = formService.isValid(formPageConfig, req, res, `/securityLanding/cancel/${bookingId}`, req.body)
      if (!valid) {
        return null
      }

      if (req.body.confirm !== 'Yes') {
        return res.redirect(`/${bookingId}`)
      }

      const details = await offendersService.getOffenderDetails(res.locals, bookingId)

      formService.cancelSecurityReferral(details.offenderNo, transactionalDbClient)

      return res.render('pages/securityCancelConfirmed', { bookingId })
    })
  )

  return router
}
