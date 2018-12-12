const express = require('express')
const flash = require('connect-flash')
const { getIn, isNilOrEmpty } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const getFormData = require('../middleware/getFormData')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const personalDetailsConfig = require('../config/personalDetails')
const transportConfig = require('../config/transport')
const agile = require('../config/agile')

const formConfig = {
  ...personalDetailsConfig,
  ...transportConfig,
  ...agile,
}

module.exports = function Index({ formService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(getFormData(formService))
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get(
    '/:section/:form',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const backLink = req.get('Referrer')
      const pageData = getIn([section, form], res.locals.formObject)
      const errors = req.flash('errors')

      res.render(`formPages/${section}/${form}`, {
        data: pageData,
        formName: form,
        backLink,
        errors,
      })
    })
  )

  router.post(
    '/:section/:form',
    asyncMiddleware(async (req, res) => {
      const { section, form } = req.params
      const formPageConfig = formConfig[form]

      const updatedFormObject = await formService.update({
        userId: 'user1',
        formId: res.locals.formId,
        formObject: res.locals.formObject,
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
          return res.redirect(`/form/${section}/${form}/`)
        }
      }

      const nextPath = getPathFor({ data: req.body, config: formConfig[form] })
      return res.redirect(`${nextPath}`)
    })
  )

  return router
}
