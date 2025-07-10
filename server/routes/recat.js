const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const { firstItem } = require('../utils/functionalHelpers')
const {
  choosingHigherCategory,
  offenderAlertsLink,
  offenderCaseNotesLink,
  offenderAdjudicationLink,
  isFemalePrisonId,
} = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')
const recat = require('../config/recat')
const Status = require('../utils/statusEnum')
const RiskChangeStatus = require('../utils/riskChangeStatusEnum')
const log = require('../../log')

const formConfig = {
  recat,
}

module.exports = function Index({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  authenticationMiddleware,
  alertService,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use(handleCsrf)

  router.get(
    '/securityInput/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'recat', 'securityInput', bookingId, transactionalDbClient)

      if (
        result.status === Status.SECURITY_MANUAL.name ||
        result.status === Status.SECURITY_AUTO.name ||
        result.status === Status.SECURITY_FLAGGED.name
      ) {
        res.redirect(`/tasklistRecat/${bookingId}`)
      } else {
        res.render('formPages/recat/securityInput', result)
      }
    }),
  )

  router.get(
    '/prisonerBackground/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'recat', 'prisonerBackground', bookingId, transactionalDbClient)
      const { offenderNo } = result.data.details
      const violenceProfile = await riskProfilerService.getViolenceProfile(offenderNo, res.locals)
      const escapeProfile = await alertService.getEscapeProfile(offenderNo, res.locals)
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        offenderNo,
        res.locals,
        false, // not used for recat (contributes towards recommended category)
      )
      const offenderDpsAlertsLink = offenderAlertsLink(offenderNo)
      const offenderDpsCaseNotesLink = offenderCaseNotesLink(offenderNo)
      const offenderDpsAdjudicationsLink = offenderAdjudicationLink(offenderNo)

      const categorisations = await offendersService.getPrisonerBackground(res.locals, offenderNo)

      const data = {
        ...result.data,
        categorisations,
        escapeProfile,
        violenceProfile,
        extremismProfile,
        offenderDpsAlertsLink,
        offenderDpsCaseNotesLink,
        offenderDpsAdjudicationsLink,
      }

      res.render(`formPages/recat/prisonerBackground`, { ...result, data })
    }),
  )

  router.get(
    '/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'recat', 'prisonerBackground', bookingId, transactionalDbClient)
      const { offenderNo } = result.data.details
      const violenceProfile = await riskProfilerService.getViolenceProfile(offenderNo, res.locals)
      const escapeProfile = await alertService.getEscapeProfile(offenderNo, res.locals)
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        offenderNo,
        res.locals,
        false, // contributes towards recommended category, only used in initial categorisations
      )

      const categorisations = await offendersService.getPrisonerBackground(res.locals, offenderNo)

      const dataToStore = {
        escapeProfile,
        extremismProfile,
        violenceProfile,
      }

      await formService.mergeRiskProfileData(bookingId, dataToStore, transactionalDbClient)

      const data = {
        ...result.data,
        ...result.reviewReason,
        categorisations,
        escapeProfile,
        violenceProfile,
        extremismProfile,
      }

      res.render(`formPages/recat/review`, { ...result, data })
    }),
  )

  router.get(
    '/riskProfileChangeDetail/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const data = await offendersService.getRiskChangeForOffender(res.locals, bookingId, transactionalDbClient)
      const errors = req.flash('errors')
      const backLink = req.get('Referrer')
      res.render('formPages/recat/riskProfileChangeDetail', { errors, backLink, data })
    }),
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'recat'
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      res.render(`formPages/${section}/${form}`, result)
    }),
  )

  const buildFormData = async (res, req, section, form, bookingId, transactionalDbClient) => {
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
    if (!formData || !formData.formObject) {
      throw new Error('No categorisation found for this booking id')
    }
    res.locals.formObject = { ...formData.formObject, ...formData.riskProfile }
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')

    const pageData = res.locals.formObject
    if (!pageData[section]) {
      pageData[section] = {}
    }
    pageData[section][form] = { ...pageData[section][form], ...firstItem(req.flash('userInput')) }

    const errors = req.flash('errors')
    const details = await offendersService.getOffenderDetails(res.locals, bookingId)
    const youngOffender = formService.isYoungOffender(details)

    return {
      data: { ...pageData, details: { ...details, youngOffender } },
      isInWomensEstate: isFemalePrisonId(details.prisonId),
      formName: form,
      status: formData.status,
      reviewReason: formData.reviewReason,
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => {
    const updated = { ...body }
    if (body.securityNoteNeeded === 'No') {
      delete updated.securityInputNeededText
    }
    if (body.transfer === 'Yes') {
      delete updated.transferText
    }
    if (body.oasysRelevantInfo === 'No') {
      delete updated.oasysInputText
    }
    return updated
  }

  router.post(
    '/securityInput/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'recat'
      const form = 'securityInput'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const updatedFormObject = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })
      await formService.referToSecurityIfRequested(
        bookingId,
        req.user.username,
        updatedFormObject,
        transactionalDbClient,
      )

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    }),
  )

  router.post(
    '/riskProfileChangeDetail/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'recat'
      const form = 'riskProfileChangeDetail'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]
      const userInput = { ...req.body }

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const bookingIdInt = parseInt(bookingId, 10)
      const status =
        userInput.confirmation === 'No'
          ? RiskChangeStatus.REVIEW_NOT_REQUIRED.name
          : RiskChangeStatus.REVIEW_REQUIRED.name

      await offendersService.handleRiskChangeDecision(
        res.locals,
        bookingIdInt,
        req.user.username,
        status,
        transactionalDbClient,
      )

      if (userInput.confirmation === 'No') {
        res.redirect(`/recategoriserCheck`)
      } else {
        // in the event of an initial categorisation the user will see an error (edge-case as this should be filtered out in the sqs service)
        res.redirect(`/tasklistRecat/${bookingId}?reason=RISK_CHANGE`)
      }
    }),
  )

  router.post(
    '/decision/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'decision'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

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

      if (userInput.category === 'D' || userInput.category === 'J' || userInput.category === 'T') {
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)
      } else {
        await formService.cancelOpenConditions(bookingIdInt, req.user.username, transactionalDbClient)
      }

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
        if (userInput.category === 'D' || userInput.category === 'J' || userInput.category === 'T') {
          // redirect to tasklist for open conditions, via 'added' page
          res.redirect(`/openConditionsAdded/${bookingId}?catType=RECAT`)
        } else {
          const nextPath = getPathFor({ data: req.body, config: formPageConfig })
          res.redirect(`${nextPath}${bookingId}`)
        }
      }
    }),
  )

  router.post(
    '/higherSecurityReview/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'higherSecurityReview'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
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
    }),
  )

  router.post(
    '/miniHigherSecurityReview/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'miniHigherSecurityReview'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
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
    }),
  )

  router.post(
    '/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'recat'
      const form = 'review'
      const formPageConfig = formConfig[section][form]

      const bookingInt = parseInt(bookingId, 10)
      const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

      const suggestedCategory = R.path(['formObject', 'recat', 'decision', 'category'], formData)
      if (suggestedCategory) {
        log.info(`Categoriser creating recat categorisation record:`)
        await formService.categoriserDecision(bookingId, req.user.username, transactionalDbClient)

        const nextReviewDate = R.path(['formObject', 'recat', 'nextReviewDate', 'date'], formData)

        await offendersService.createOrUpdateCategorisation({
          context: res.locals,
          bookingId: bookingInt,
          suggestedCategory,
          overriddenCategoryText: 'Cat-tool Recat',
          nextReviewDate,
          nomisSeq: formData.nomisSeq,
          transactionalDbClient,
        })

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        throw new Error('category has not been specified')
      }
    }),
  )

  router.post(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'recat'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    }),
  )

  return router
}
