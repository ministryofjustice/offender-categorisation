const express = require('express')
const flash = require('connect-flash')
const { firstItem, extractNextReviewDate } = require('../utils/functionalHelpers')
const { calculateNextReviewDate } = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const nextReviewDate = require('../config/nextReviewDate')
const Status = require('../utils/statusEnum')

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
      const result = await buildFormData(res, req, form, bookingId, true, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, { ...result, date: calculateNextReviewDate(nextDateChoice) })
    })
  )

  router.get(
    '/nextReviewDateStandalone/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'nextReviewDateStandalone'
      const result = await buildFormData(res, req, form, bookingId, false, transactionalDbClient)
      if (result.status && result.status !== Status.APPROVED.name) {
        await transactionalDbClient.query('ROLLBACK')
        return res.render('pages/error', {
          message: 'Categorisation is in progress: please use the tasklist to change date',
          backLink: `/${bookingId}`,
        })
      }
      return res.render(`formPages/nextReviewDate/${form}`, result)
    })
  )

  router.get(
    '/nextReviewDateStandaloneConfirmed/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'nextReviewDateStandaloneConfirmed'
      const result = await buildFormData(res, req, form, bookingId, false, transactionalDbClient)
      res.render(`pages/nextReviewDateStandaloneConfirmed`, result)
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, form, bookingId, true, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, result)
    })
  )

  const buildFormData = async (res, req, form, bookingId, strict, transactionalDbClient) => {
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
    if (strict && !formData.formObject) {
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
    const nomisDate = extractNextReviewDate(details)

    return {
      data: { ...pageData, details },
      formName: form,
      status: formData.status,
      reviewReason: formData.reviewReason,
      catType: formData.catType,
      date,
      nomisDate,
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => ({ ...body })

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

      // Handle the possibility that there is no PG database entry: still allow Nomis update for standalone
      if (userInput.catType) {
        const formSection = userInput.catType === 'RECAT' ? 'recat' : 'ratings'
        await formService.update({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection,
          formName: 'nextReviewDate',
          transactionalClient: transactionalDbClient,
        })
      }

      if (form === 'nextReviewDateStandalone') {
        await offendersService.updateNextReviewDate(res.locals, bookingId, userInput.date)
      }

      const nextPath = getPathFor({ data: userInput, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
