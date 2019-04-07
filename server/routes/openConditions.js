const express = require('express')
const flash = require('connect-flash')
const { firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const openConditions = require('../config/openConditions')

const formConfig = {
  openConditions,
}

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
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
    '/openConditionsNotSuitable/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'openConditions', 'dummy', bookingId)
      res.render(`pages/openConditionsNotSuitable`, { ...result })
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, 'openConditions', form, bookingId)
      res.render(`openConditions/${form}`, { ...result })
    })
  )

  const buildFormData = async (res, req, section, form, bookingId) => {
    const user = await userService.getUser(res.locals.user.token)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId)
    res.locals.formObject = formData.form_response || {}
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
    if (body.justify === 'No') {
      updated.justifyText = ''
    }
    return updated
  }

  router.post(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { form, bookingId } = req.params
      const section = 'openConditions'
      const formPageConfig = formConfig.openConditions[form]

      const valid = formService.doValidation(formPageConfig, req, res, section, form, bookingId)
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
      })

      if (req.body.justify === 'No') {
        res.render('pages/openConditionsNotSuitable', {
          warningText:
            'This person cannot be sent to open conditions because they have more than three years to their' +
            ' earliest release date and there are no special circumstances to warrant them moving into open conditions',
          bookingId,
        })
      } else if (req.body.formCompleted === 'No') {
        res.render('pages/openConditionsNotSuitable', {
          warningText:
            'This person cannot be sent to open conditions because they are a foreign national but have' +
            ' not completed a CCD3 form',
          bookingId,
        })
      } else if (req.body.exhaustedAppeal === 'Yes') {
        res.render('pages/openConditionsNotSuitable', {
          warningText:
            'This person cannot be sent to open conditions because they are due to be deported and' +
            ' have exhausted all appeal rights',
          bookingId,
        })
      } else {
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    })
  )

  return router
}
