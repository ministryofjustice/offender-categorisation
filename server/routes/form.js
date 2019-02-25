const moment = require('moment')
const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const ratings = require('../config/ratings')
const categoriser = require('../config/categoriser')
const supervisor = require('../config/supervisor')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
}

function isYoungOffender(details) {
  const dob = details && details.dateOfBirth
  if (!dob) {
    return false
  }
  const d = moment(dob, 'YYYY-MM-DD')
  return d.isAfter(moment().subtract(21, 'years'))
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

  router.get(
    '/ratings/offendingHistory/:bookingId',
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'offendingHistory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
      const history = await offendersService.getCategoryHistory(res.locals.user.token, result.data.details.offenderNo)
      const data = { ...result.data, history }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'securityInput'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
      const socProfile = await riskProfilerService.getSecurityProfile(
        result.data.details.offenderNo,
        res.locals.user.username
      )
      await formService.referToSecurityIfRiskAssessed(bookingId, req.user.username, socProfile)
      const data = { ...result.data, socProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/violenceRating/:bookingId',
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'violenceRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
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
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'escapeRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
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
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'extremismRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
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
    asyncMiddleware(async (req, res) => {
      const section = 'categoriser'
      const form = 'provisionalCategory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
      const suggestedCat = 'B' // TODO await riskProfilerService.getAllFourProfiles??(result.data.details.offenderNo, res.locals.user.username)
      const data = { ...result.data, suggestedCat: isYoungOffender(result.data.details) ? 'I' : suggestedCat }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/categoriser/review/:bookingId',
    asyncMiddleware(async (req, res) => {
      await renderReview(req, res, 'formPages/categoriser/review')
    })
  )

  router.get(
    '/supervisor/review/:bookingId',
    asyncMiddleware(async (req, res) => {
      await renderReview(req, res, 'formPages/supervisor/review')
    })
  )

  router.get(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form, bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId)
      res.render(`formPages/${section}/${form}`, result)
    })
  )

  const buildFormData = async (res, req, section, form, bookingId) => {
    const user = await userService.getUser(res.locals.user.token)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId)
    res.locals.formObject = formData.form_response || {}
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')
    const pageData = getIn([section, form], res.locals.formObject)
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

  const renderReview = async (req, res, page) => {
    const { bookingId } = req.params
    const result = await buildFormDataForAllRatings(res, req, bookingId)
    const escapeProfile = await riskProfilerService.getEscapeProfile(
      result.data.details.offenderNo,
      res.locals.user.username
    )
    const socProfile = await riskProfilerService.getSecurityProfile(
      result.data.details.offenderNo,
      res.locals.user.username
    )
    const extremismProfile = await riskProfilerService.getExtremismProfile(
      result.data.details.offenderNo,
      res.locals.user.username,
      false // TODO
    )
    const violenceProfile = await riskProfilerService.getViolenceProfile(
      result.data.details.offenderNo,
      res.locals.user.username
    )
    const data = {
      ...result.data,
      socProfile,
      escapeProfile,
      extremismProfile,
      violenceProfile,
    }
    res.render(page, { ...result, data })
  }

  const buildFormDataForAllRatings = async (res, req, bookingId) => {
    const user = await userService.getUser(res.locals.user.token)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId)
    res.locals.formObject = formData.form_response || {}
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')
    const pageData = getIn(['ratings'], res.locals.formObject)
    const provisionalCategoryData = getIn(['categoriser'], res.locals.formObject)
    const errors = req.flash('errors')
    const details = await offendersService.getOffenderDetails(res.locals.user.token, bookingId)

    return {
      data: { ...pageData, ...provisionalCategoryData, details },
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => {
    const updated = Object.assign({}, body)
    if (body.securityInputNeeded === 'No') {
      updated.securityInputNeededText = ''
    }
    if (body.escapeFurtherCharges === 'No') {
      updated.escapeFurtherChargesText = ''
    }
    if (body.highRiskOfViolence === 'No') {
      updated.highRiskOfViolenceText = ''
    }
    if (body.seriousThreat === 'No') {
      updated.seriousThreatText = ''
    }
    if (body.categoryAppropriate === 'Yes') {
      updated.overriddenCategory = ''
      updated.overriddenCategoryText = ''
    }
    return updated
  }

  router.post(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res) => {
      const section = 'ratings'
      const form = 'securityInput'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      const updatedFormObject = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
      })
      await formService.referToSecurityIfRequested(bookingId, req.user.username, updatedFormObject)

      if (formPageConfig.validate) {
        const formResponse = getIn([section, form], updatedFormObject)
        const errors = formService.getValidationErrors(formResponse, formPageConfig)

        if (!isNilOrEmpty(errors)) {
          req.flash('errors', errors)
          return res.redirect(`/form/${section}/${form}/${bookingId}`)
        }
      }

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      return res.redirect(`${nextPath}${bookingId}`)
    })
  )

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { section, form, bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      const updatedFormObject = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: clearConditionalFields(req.body),
        formSection: section,
        formName: form,
      })

      if (formPageConfig.validate) {
        const formResponse = getIn([section, form], updatedFormObject)
        const errors = formService.getValidationErrors(formResponse, formPageConfig)

        if (!isNilOrEmpty(errors)) {
          req.flash('errors', errors)
          return res.redirect(`/form/${section}/${form}/${bookingId}`)
        }
      }

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      return res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
