const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const personalDetailsConfig = require('../config/personalDetails')
const transportConfig = require('../config/transport')
const agile = require('../config/agile')
const ratings = require('../config/ratings')

const formConfig = {
  ...personalDetailsConfig,
  ...transportConfig,
  ...agile,
  ...ratings,
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
      const data = { ...result.data, socProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
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
      backLink,
      errors,
    }
  }

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { offenderNo } = req.body
      const { section, form, bookingId } = req.params
      const formPageConfig = formConfig[form]

      const updatedFormObject = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        offenderNo,
        config: formPageConfig,
        userInput: req.body,
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

      const nextPath = getPathFor({ data: req.body, config: formConfig[form] })
      return res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
