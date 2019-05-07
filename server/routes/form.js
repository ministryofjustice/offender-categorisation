const express = require('express')
const flash = require('connect-flash')
const { firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')

const ratings = require('../config/ratings')
const categoriser = require('../config/categoriser')
const supervisor = require('../config/supervisor')
const security = require('../config/security')
const openConditions = require('../config/openConditions')
const createOpenConditionsRouter = require('./openConditions')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
  security,
  openConditions,
}

module.exports = function Index({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  authenticationMiddleware,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  const openConditionsRouter = createOpenConditionsRouter({
    formService,
    offendersService,
    userService,
    authenticationMiddleware,
  })
  router.use('/openConditions/', openConditionsRouter)

  router.get(
    '/ratings/offendingHistory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'offendingHistory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const history = await offendersService.getCatAInformation(res.locals.user.token, result.data.details.offenderNo)
      const offences = await offendersService.getOffenceHistory(res.locals.user.token, result.data.details.offenderNo)
      const data = { ...result.data, history, offences }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'ratings', 'securityInput', bookingId, transactionalDbClient)

      if (result.status === Status.SECURITY_MANUAL.name || result.status === Status.SECURITY_AUTO.name) {
        res.redirect(`/tasklist/${bookingId}`)
      } else {
        res.render('formPages/ratings/securityInput', result)
      }
    })
  )

  router.get(
    '/ratings/violenceRating/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'violenceRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const violenceProfile = await riskProfilerService.getViolenceProfile(
        result.data.details.offenderNo,
        res.locals.user.username
      )
      const data = { ...result.data, violenceProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/escapeRating/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'escapeRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const escapeProfile = await riskProfilerService.getEscapeProfile(
        result.data.details.offenderNo,
        res.locals.user.username
      )
      const data = { ...result.data, escapeProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/extremismRating/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'extremismRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        result.data.details.offenderNo,
        res.locals.user.username,
        false // TODO
      )
      const data = { ...result.data, extremismProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/categoriser/provisionalCategory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'categoriser'
      const form = 'provisionalCategory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)

      if (result.data.openConditionsRequested) {
        const suggestedCat = formService.isYoungOffender(result.data.details) ? 'J' : 'D'
        const data = { ...result.data, suggestedCat }

        res.render(`formPages/openConditions/provisionalCategory`, { ...result, data })
      } else {
        const suggestedCat = formService.computeSuggestedCat(result.data)
        const data = { ...result.data, suggestedCat }
        res.render(`formPages/${section}/${form}`, { ...result, data })
      }
    })
  )

  router.get(
    '/categoriser/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'categoriser', 'review', bookingId, transactionalDbClient)

      const history = await offendersService.getCatAInformation(res.locals.user.token, result.data.details.offenderNo)
      const offences = await offendersService.getOffenceHistory(res.locals.user.token, result.data.details.offenderNo)

      const escapeProfile = await riskProfilerService.getEscapeProfile(
        result.data.details.offenderNo,
        res.locals.user.username
      )
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        result.data.details.offenderNo,
        res.locals.user.username,
        result.data.ratings &&
          result.data.ratings.extremismRating &&
          result.data.ratings.extremismRating.previousTerrorismOffences === 'Yes'
      )
      const violenceProfile = await riskProfilerService.getViolenceProfile(
        result.data.details.offenderNo,
        res.locals.user.username
      )

      const dataToStore = {
        history,
        escapeProfile,
        extremismProfile,
        violenceProfile,
      }
      const dataToDisplay = {
        ...result.data,
        history,
        offences,
        escapeProfile,
        extremismProfile,
        violenceProfile,
      }

      await formService.mergeRiskProfileData(bookingId, dataToStore, transactionalDbClient)

      res.render('formPages/categoriser/review', { ...result, data: dataToDisplay })
    })
  )

  router.post(
    '/supervisor/confirmBack/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'supervisor'
      const form = 'confirmBack'
      const formPageConfig = formConfig[section][form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      const changeConfirmed = req.body.confirmation === 'Yes'

      if (changeConfirmed) {
        await formService.backToCategoriser(bookingId, transactionalDbClient)
      }

      const nextPath = changeConfirmed ? '/supervisorHome' : `/form/supervisor/review/${bookingId}`
      res.redirect(`${nextPath}`)
    })
  )

  router.get(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { section, form, bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      res.render(`formPages/${section}/${form}`, result)
    })
  )

  router.get(
    '/approvedView/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient)
      res.render(`formPages/approvedView`, result)
    })
  )

  const buildFormData = async (res, req, section, form, bookingId, transactionalDbClient) => {
    const user = await userService.getUser(res.locals.user.token)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
    res.locals.formObject = formData.formObject || {}
    res.locals.formObject = { ...res.locals.formObject, ...formData.riskProfile }
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')

    const pageData = res.locals.formObject
    if (!pageData[section]) {
      pageData[section] = {}
    }
    pageData[section][form] = { ...pageData[section][form], ...firstItem(req.flash('userInput')) }

    const errors = req.flash('errors')
    const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)

    return {
      data: { ...pageData, details },
      formName: form,
      status: formData.status,
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => {
    const updated = Object.assign({}, body)
    if (body.securityInputNeeded === 'No') {
      delete updated.securityInputNeededText
    }
    if (body.escapeOtherEvidence === 'No') {
      delete updated.escapeOtherEvidenceText
    }
    if (body.escapeCatB === 'No') {
      delete updated.escapeCatBText
    }
    if (body.highRiskOfViolence === 'No') {
      delete updated.highRiskOfViolenceText
    }
    if (body.seriousThreat === 'No') {
      delete updated.seriousThreatText
    }
    if (body.categoryAppropriate === 'Yes') {
      delete updated.overriddenCategory
      delete updated.overriddenCategoryText
    }
    if (body.supervisorCategoryAppropriate === 'Yes') {
      delete updated.supervisorOverriddenCategory
      delete updated.supervisorOverriddenCategoryText
    }
    if (body.furtherCharges === 'No') {
      delete updated.furtherChargesCatB
      delete updated.furtherChargesText
    }
    if (body.previousConvictions === 'No') {
      delete updated.previousConvictionsText
    }
    return updated
  }

  const requiresOpenConditions = async (bookingId, transactionalDbClient) => {
    const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

    const dataToStore = {
      ...categorisationRecord.formObject, // merge any existing form data
      openConditionsRequested: true,
    }
    await formService.updateFormData(bookingId, dataToStore, transactionalDbClient)
  }

  router.post(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'securityInput'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      const updatedFormObject = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })
      await formService.referToSecurityIfRequested(
        bookingId,
        req.user.username,
        updatedFormObject,
        transactionalDbClient
      )

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  router.post(
    '/ratings/securityBack/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'securityBack'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  router.post(
    '/security/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'security'
      const form = 'review'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      // TODO tech debt - 1. no transaction boundary for these two db updates 2. investigate combining, status validation only performed on second part
      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      await formService.securityReviewed(bookingId, req.user.username, transactionalDbClient)

      res.redirect('/')
    })
  )

  router.post(
    '/categoriser/provisionalCategory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'categoriser'
      const form = 'provisionalCategory'
      const formPageConfig = formConfig[section][form]

      const userInput = clearConditionalFields(req.body)

      if (userInput.overriddenCategory !== 'D' && userInput.overriddenCategory !== 'J') {
        if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
          return
        }

        await formService.update({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          status: Status.AWAITING_APPROVAL.name,
          transactionalClient: transactionalDbClient,
        })
        await offendersService.createInitialCategorisation(res.locals.user.token, bookingId, userInput)

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        await requiresOpenConditions(bookingId, transactionalDbClient)

        // redirect to tasklist for open conditions
        res.redirect(`/tasklist/${bookingId}`)
      }
    })
  )

  router.post(
    '/supervisor/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'supervisor'
      const form = 'review'
      const formPageConfig = formConfig[section][form]

      const userInput = clearConditionalFields(req.body)

      if (userInput.supervisorOverriddenCategory !== 'D' && userInput.supervisorOverriddenCategory !== 'J') {
        if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
          return
        }

        await formService.update({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          status: Status.APPROVED.name,
          transactionalClient: transactionalDbClient,
        })
        await offendersService.createSupervisorApproval(res.locals.user.token, bookingId, userInput)

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        await requiresOpenConditions(bookingId, transactionalDbClient)

        // send back to the categoriser for open conditions completion
        await formService.backToCategoriser(bookingId, transactionalDbClient)
        res.redirect(`/supervisorHome`)
      }
    })
  )

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { section, form, bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      const valid = formService.isValid(formPageConfig, req, res, section, form, bookingId)
      if (!valid) {
        return
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
