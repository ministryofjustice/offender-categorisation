const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const log = require('../../log')

const { firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')

const ratings = require('../config/ratings')
const categoriser = require('../config/categoriser')
const supervisor = require('../config/supervisor')
const security = require('../config/security')
const openConditions = require('../config/openConditions')

const CatType = require('../utils/catTypeEnum')

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
        false // don't yet have the answer the question - will be populated correctly in the review route
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
        res.redirect(`/form/openConditions/provisionalCategory/${bookingId}`)
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
        offences,
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

  router.get(
    '/supervisor/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'supervisor'
      const result = await buildFormData(res, req, section, 'review', bookingId, transactionalDbClient)

      if (result.catType === CatType.INITIAL.name) {
        res.render(`formPages/${section}/review`, result)
      } else {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals.user.token,
          result.data.details.offenderNo
        )
        const data = { ...result.data, categorisations }
        res.render(`formPages/${section}/recatReview`, { ...result, data })
      }
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
    '/awaitingApprovalView/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient)

      if (result.catType === CatType.INITIAL.name) {
        res.render('formPages/categoriser/awaitingApprovalView', result)
      } else {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals.user.token,
          result.data.details.offenderNo
        )
        const data = { ...result.data, categorisations }
        res.render('formPages/recat/awaitingApprovalView', { ...result, data })
      }
    })
  )

  router.get(
    '/approvedView/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient)

      if (result.catType === CatType.INITIAL.name) {
        res.render(`formPages/approvedView`, result)
      } else {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals.user.token,
          result.data.details.offenderNo
        )
        const data = { ...result.data, categorisations }
        res.render(`formPages/recat/approvedView`, { ...result, data })
      }
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
      catType: formData.catType,
      reviewReason: formData.reviewReason,
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
    if (body.previousTerrorismOffences === 'No') {
      delete updated.previousTerrorismOffencesText
    }
    if (body.previousOverrideCategoryText === '') {
      delete updated.previousOverrideCategoryText
    }
    if (body.otherInformationText === '') {
      delete updated.otherInformationText
    }
    if (body.overriddenCategory === '') {
      delete updated.overriddenCategory
    }
    if (body.overriddenCategoryText === '') {
      delete updated.overriddenCategoryText
    }
    if (body.confirmation === 'No') {
      delete updated.message
    }
    return updated
  }

  router.post(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
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
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
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
    })
  )

  router.post(
    '/supervisor/confirmBack/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'supervisor'
      const form = 'confirmBack'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const newData = R.assocPath(['supervisor', 'confirmBack', 'isRead'], false, userInput)

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: newData,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })
      const changeConfirmed = userInput.confirmation === 'Yes'
      if (changeConfirmed) {
        await formService.backToCategoriser(bookingId, transactionalDbClient)
      }

      const nextPath = changeConfirmed ? '/supervisorHome' : `/form/supervisor/review/${bookingId}`
      res.redirect(`${nextPath}`)
    })
  )

  router.post(
    '/supervisor/supervisorMessage/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const categorisationRecord = await formService.backToCategoriserMessageRead(bookingId, transactionalDbClient)

      const nextPath =
        categorisationRecord.catType === 'INITIAL' ? `/tasklist/${bookingId}` : `/tasklistRecat/${bookingId}`
      res.redirect(`${nextPath}`)
    })
  )

  router.post(
    '/security/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'security'
      const form = 'review'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
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

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const bookingInt = parseInt(bookingId, 10)

      if (userInput.overriddenCategory !== 'D' && userInput.overriddenCategory !== 'J') {
        log.info(`Categoriser creating initial categorisation record:`)
        await formService.categoriserDecisionWithFormResponse({
          bookingId: bookingInt,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          userId: req.user.username,
          transactionalClient: transactionalDbClient,
        })

        const nomisKeyMap = await offendersService.createInitialCategorisation({
          token: res.locals.user.token,
          bookingId: bookingInt,
          overriddenCategory: userInput.overriddenCategory,
          suggestedCategory: userInput.suggestedCategory,
          overriddenCategoryText: userInput.overriddenCategoryText,
        })

        await formService.recordNomisSeqNumber(bookingInt, nomisKeyMap.sequenceNumber, transactionalDbClient)

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        // persist the open conditions override and return to complete the open conditions route
        log.info(`Categoriser overriding to Category ${userInput.overriddenCategory}`)
        await formService.update({
          bookingId: bookingInt,
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          transactionalClient: transactionalDbClient,
          logUpdate: true,
        })
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)

        // redirect to tasklist for open conditions, via 'added' page
        res.redirect(`/openConditionsAdded/${bookingId}?catType=INITIAL`)
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

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      if (userInput.supervisorOverriddenCategory !== 'D' && userInput.supervisorOverriddenCategory !== 'J') {
        await formService.supervisorApproval({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          transactionalClient: transactionalDbClient,
        })
        await offendersService.createSupervisorApproval(res.locals.user.token, bookingId, userInput)

        const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

        if (userInput.catType === CatType.RECAT.name) {
          const categorisations = await offendersService.getPrisonerBackground(
            res.locals.user.token,
            categorisationRecord.offenderNo
          )
          const dataToStore = {
            catHistory: categorisations,
          }

          await formService.mergeRiskProfileData(bookingId, dataToStore, transactionalDbClient)
        }

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        // persist the open conditions override and return to categoriser to complete the open conditions route.
        const userInputAdditionalAudit = {
          supervisorSentBackOverriddenCategoryText: userInput.supervisorOverriddenCategoryText,
          ...userInput,
        }
        log.info(`Supervisor overriding to Category ${userInput.supervisorOverriddenCategory}`)
        await formService.update({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput: userInputAdditionalAudit,
          formSection: section,
          formName: form,
          transactionalClient: transactionalDbClient,
          logUpdate: true,
        })
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)

        // Reset cat so it appears the categoriser originally chose open conditions!
        if (userInput.catType === CatType.INITIAL.name) {
          const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
          const { formObject } = categorisationRecord
          const newData = R.assocPath(
            ['categoriser', 'provisionalCategory'],
            {
              suggestedCategory: userInput.supervisorOverriddenCategory,
              categoryAppropriate: 'Yes',
              otherInformationText: formObject.categoriser.provisionalCategory.otherInformationText,
            },
            formObject
          )
          await formService.updateFormData(bookingId, newData, transactionalDbClient)
        } else {
          // delete recat decision to force a new decision once open conditions completed
          await formService.deleteFormData({
            bookingId: parseInt(bookingId, 10),
            formSection: 'recat',
            formName: 'decision',
            transactionalClient: transactionalDbClient,
          })
        }

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
    })
  )

  return router
}
