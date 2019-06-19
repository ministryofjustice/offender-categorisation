const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const { firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const recat = require('../config/recat')
const Status = require('../utils/statusEnum')
const log = require('../../log')

const formConfig = {
  recat,
}
const catMap = new Set(['DB', 'DC', 'CB', 'JI', 'JC', 'JB'])

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
    '/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'ratings', 'securityInput', bookingId, transactionalDbClient)

      if (result.status === Status.SECURITY_MANUAL.name || result.status === Status.SECURITY_AUTO.name) {
        res.redirect(`/tasklistRecat/${bookingId}`)
      } else {
        res.render('formPages/recat/securityInput', result)
      }
    })
  )

  router.get(
    '/prisonerBackground/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'recat', 'prisonerBackground', bookingId, transactionalDbClient)
      const { offenderNo } = result.data.details
      const violenceProfile = await riskProfilerService.getViolenceProfile(offenderNo, res.locals.user.username)
      const escapeProfile = await riskProfilerService.getEscapeProfile(offenderNo, res.locals.user.username)
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        offenderNo,
        res.locals.user.username,
        false // TODO
      )

      const categorisations = await offendersService.getPrisonerBackground(res.locals.user.token, offenderNo)

      const data = { ...result.data, categorisations, escapeProfile, violenceProfile, extremismProfile }

      res.render(`formPages/recat/prisonerBackground`, { ...result, data })
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'recat'
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      res.render(`formPages/${section}/${form}`, result)
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
    const youngOffender = formService.isYoungOffender(details)

    return {
      data: { ...pageData, details: { ...details, youngOffender } },
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
    if (body.transfer === 'No') {
      delete updated.transferText
    }
    return updated
  }

  router.post(
    '/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'recat'
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
    '/decision/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'decision'
      const formPageConfig = formConfig[section][form]

      const valid = formService.isValid(formPageConfig, req, res, section, form, bookingId)
      if (!valid) {
        return
      }

      const userInput = clearConditionalFields(req.body)
      const bookingIdInt = parseInt(bookingId, 10)

      await formService.update({
        bookingId: bookingIdInt,
        userId: req.user.username,
        config: formPageConfig,
        userInput,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      if (userInput.currentCategory === 'I' && userInput.category === 'B') {
        res.redirect(`/form/recat/miniHigherSecurityReview/${bookingId}`)
      } else if (choosingHigherCategory(userInput.currentCategory, userInput.category)) {
        res.redirect(`/form/recat/higherSecurityReview/${bookingId}`)
      } else {
        await formService.deleteFormData({
          bookingId: bookingIdInt,
          formSection: 'recat',
          formName: 'higherSecurityReview',
          transactionalClient: transactionalDbClient,
        })
        await formService.deleteFormData({
          bookingId: bookingIdInt,
          formSection: 'recat',
          formName: 'miniHigherSecurityReview',
          transactionalClient: transactionalDbClient,
        })
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    })
  )

  router.post(
    '/higherSecurityReview/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'higherSecurityReview'
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

      await formService.deleteFormData({
        bookingId: parseInt(bookingId, 10),
        formSection: 'recat',
        formName: 'miniHigherSecurityReview',
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  router.post(
    '/miniHigherSecurityReview/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'miniHigherSecurityReview'
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

      await formService.deleteFormData({
        bookingId: parseInt(bookingId, 10),
        formSection: 'recat',
        formName: 'higherSecurityReview',
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  const choosingHigherCategory = (current, newCat) => catMap.has(current + newCat)

  router.post(
    '/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'review'
      const formPageConfig = formConfig[section][form]

      const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

      const suggestedCategory = R.path(['formObject', 'recat', 'decision', 'category'], formData)
      if (suggestedCategory) {
        if (suggestedCategory !== 'D' && suggestedCategory !== 'J') {
          log.info(`Categoriser creating recat categorisation record:`)
          await formService.setAwaitingApproval(bookingId, transactionalDbClient)

          const nextReviewDate = R.path(['formObject', 'recat', 'nextReviewDate', 'date'], formData)
          await offendersService.createInitialCategorisation({
            token: res.locals.user.token,
            bookingId,
            suggestedCategory,
            overriddenCategoryText: 'Cat-tool Recat',
            nextReviewDate,
          })

          const nextPath = getPathFor({ data: req.body, config: formPageConfig })
          res.redirect(`${nextPath}${bookingId}`)
        } else {
          // persist the open conditions override and return to complete the open conditions route
          log.info(`Categoriser recat - adding open conditions`)

          await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)

          // redirect to tasklist for open conditions
          res.redirect(`/tasklistRecat/${bookingId}`)
        }
      } else {
        throw new Error('category has not been specified')
      }
    })
  )

  router.post(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'recat'
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
