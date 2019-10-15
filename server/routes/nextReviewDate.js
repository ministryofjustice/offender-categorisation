const express = require('express')
const flash = require('connect-flash')
const { firstItem } = require('../utils/functionalHelpers')
const { calculateNextReviewDate } = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const nextReviewDate = require('../config/nextReviewDate')

const formConfig = {
  nextReviewDate,
}

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())
  router.use(handleCsrf)

  router.get(
    '/nextReviewDate/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const { nextDateChoice } = req.query
      const form = 'nextReviewDate'
      const result = await buildFormData(res, req, form, bookingId, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, { ...result, date: calculateNextReviewDate(nextDateChoice) })
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, form, bookingId, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, result)
    })
  )

  const buildFormData = async (res, req, form, bookingId, transactionalDbClient) => {
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
    if (!formData || !formData.formObject) {
      throw new Error('No categorisation found for this booking id')
    }
    res.locals.formObject = { ...formData.formObject, ...formData.riskProfile }
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')
    const section = formData.catType === 'RECAT' ? 'recat' : 'ratings'
    const pageData = res.locals.formObject
    if (!pageData[section]) {
      pageData[section] = {}
    }
    pageData[section][form] = { ...pageData[section][form], ...firstItem(req.flash('userInput')) }

    const errors = req.flash('errors')
    const details = await offendersService.getOffenderDetails(res.locals, bookingId)
    const date = pageData[section] && pageData[section].nextReviewDate && pageData[section].nextReviewDate.date

    return {
      data: { ...pageData, details },
      formName: form,
      status: formData.status,
      reviewReason: formData.reviewReason,
      catType: formData.catType,
      date,
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => {
    const updated = Object.assign({}, body)
    return updated
  }

  router.post(
    '/nextReviewDateQuestion/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const section = 'nextReviewDate'
      const form = 'nextReviewDateQuestion'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}?nextDateChoice=${userInput.nextDateChoice}`)
    })
  )

  router.post(
    '/nextReviewDateEditing/:bookingId',
    asyncMiddleware(async (req, res) => {
      res.redirect(`/tasklistRecat/${req.params.bookingId}`)
    })
  )

  router.post(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'nextReviewDate'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }
      const formSection = userInput.catType === 'RECAT' ? 'recat' : 'ratings'
      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
        formSection,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
