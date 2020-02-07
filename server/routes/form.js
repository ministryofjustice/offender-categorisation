const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const moment = require('moment')
const log = require('../../log')

const { firstItem } = require('../utils/functionalHelpers')
const { getLongDateFormat } = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const Status = require('../utils/statusEnum')

const ratings = require('../config/ratings')
const categoriser = require('../config/categoriser')
const supervisor = require('../config/supervisor')
const security = require('../config/security')
const openConditions = require('../config/openConditions')
const cancel = require('../config/cancel')

const CatType = require('../utils/catTypeEnum')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
  security,
  openConditions,
  cancel,
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

  router.use(handleCsrf)

  router.get(
    '/ratings/offendingHistory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'offendingHistory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const history = await offendersService.getCatAInformation(res.locals, result.data.details.offenderNo, bookingId)
      const offences = await offendersService.getOffenceHistory(res.locals, result.data.details.offenderNo)
      const data = { ...result.data, history, offences }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    })
  )

  router.get(
    '/ratings/securityInput/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'ratings', 'securityInput', bookingId, transactionalDbClient)

      if (
        result.status === Status.SECURITY_MANUAL.name ||
        result.status === Status.SECURITY_AUTO.name ||
        result.status === Status.SECURITY_FLAGGED.name
      ) {
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
      const violenceProfile = await riskProfilerService.getViolenceProfile(result.data.details.offenderNo, res.locals)
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
      const escapeProfile = await riskProfilerService.getEscapeProfile(result.data.details.offenderNo, res.locals)
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
        res.locals,
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

      const history = await offendersService.getCatAInformation(res.locals, result.data.details.offenderNo, bookingId)
      const offences = await offendersService.getOffenceHistory(res.locals, result.data.details.offenderNo)

      const escapeProfile = await riskProfilerService.getEscapeProfile(result.data.details.offenderNo, res.locals)
      const extremismProfile = await riskProfilerService.getExtremismProfile(
        result.data.details.offenderNo,
        res.locals,
        result.data.ratings &&
          result.data.ratings.extremismRating &&
          result.data.ratings.extremismRating.previousTerrorismOffences === 'Yes'
      )
      const violenceProfile = await riskProfilerService.getViolenceProfile(result.data.details.offenderNo, res.locals)
      const lifeProfile = await riskProfilerService.getLifeProfile(result.data.details.offenderNo, res.locals)

      const dataToStore = {
        history,
        offences,
        escapeProfile,
        extremismProfile,
        violenceProfile,
        lifeProfile,
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
        const categorisations = await offendersService.getPrisonerBackground(res.locals, result.data.details.offenderNo)
        const data = { ...result.data, categorisations }
        res.render(`formPages/${section}/recatReview`, { ...result, data })
      }
    })
  )

  router.get(
    '/security/review/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'security'
      const result = await buildFormData(res, req, section, 'review', bookingId, transactionalDbClient)
      const securityReferral = await getSecurityReferral(
        res.locals,
        result.data.details.offenderNo,
        transactionalDbClient
      )
      res.render(`formPages/security/review`, { ...result, securityReferred: { ...securityReferral } })
    })
  )

  const getSecurityReferral = async (context, offenderNo, transactionalDbClient) => {
    const securityReferral = await formService.getSecurityReferral(offenderNo, transactionalDbClient)

    const isSecurityReferred = securityReferral.status === 'REFERRED' // we are after cases that were flagged, THEN referred to security, when the review was started

    if (isSecurityReferred) {
      const isReferrerCurrentUser = securityReferral.userId === context.user.username
      const referrerUser = !isReferrerCurrentUser
        ? await userService.getUserByUserId(context, securityReferral.userId)
        : context.user
      const prisonDescription =
        securityReferral.prisonId === context.user.activeCaseLoad.caseLoadId
          ? context.user.activeCaseLoad.description
          : await offendersService.getOptionalAssessmentAgencyDescription(context, securityReferral.prisonId)
      return {
        securityReferral,
        isSecurityReferred,
        referrerUser,
        prisonDescription,
        referredDate: securityReferral.raisedDate && moment(securityReferral.raisedDate).format('DD/MM/YYYY'),
      }
    }

    return {
      isSecurityReferred,
    }
  }

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
        const categorisations = await offendersService.getPrisonerBackground(res.locals, result.data.details.offenderNo)
        const data = { ...result.data, categorisations }
        res.render('formPages/recat/awaitingApprovalView', { ...result, data })
      }
    })
  )

  router.get(
    '/approvedView/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const { sequenceNo } = req.query
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient, sequenceNo)
      const prisonDescription = await offendersService.getOptionalAssessmentAgencyDescription(
        res.locals,
        result.prisonId
      )
      const approvalDateDisplay = getLongDateFormat(result.approvalDate)
      if (result.catType === CatType.INITIAL.name) {
        res.render(`formPages/approvedView`, { ...result, approvalDateDisplay, prisonDescription })
      } else {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals,
          result.data.details.offenderNo,
          result.approvalDate
        )
        const data = { ...result.data, categorisations }
        res.render(`formPages/recat/approvedView`, { ...result, data, approvalDateDisplay, prisonDescription })
      }
    })
  )

  router.get(
    '/cancel/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'cancel', bookingId, transactionalDbClient)
      const { referer } = req.headers
      const categorisations =
        result.catType === CatType.RECAT.name
          ? await offendersService.getPrisonerBackground(res.locals, result.data.details.offenderNo)
          : null
      const data = { ...result.data, categorisations, referer }
      res.render('formPages/cancel', { ...result, data })
    })
  )

  router.get(
    '/cancelConfirmed/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)

      res.render('pages/cancelConfirmed', { data: { details } })
    })
  )

  const buildFormData = async (res, req, section, form, bookingId, transactionalDbClient, sequenceNo) => {
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals.user }

    if (sequenceNo && Number.isNaN(parseInt(sequenceNo, 10))) {
      throw new Error('Invalid sequenceNo')
    }
    const formData = sequenceNo
      ? await formService.getCategorisationRecordUsingSequence(bookingId, sequenceNo, transactionalDbClient)
      : await formService.getCategorisationRecord(bookingId, transactionalDbClient)

    if (!formData || !formData.formObject) {
      throw new Error('No categorisation found for this booking id / sequence no')
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
      formName: form,
      status: formData.status,
      catType: formData.catType,
      reviewReason: formData.reviewReason,
      approvalDate: formData.approvalDate,
      prisonId: formData.prisonId,
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
        await offendersService.backToCategoriser(res.locals, bookingId, transactionalDbClient)
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

      if (userInput.button === 'submit') {
        await formService.securityReviewed(bookingId, req.user.username, transactionalDbClient)
      }
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
        const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

        log.info(`Categoriser creating initial categorisation record for ${formData.offenderNo}:`)
        await formService.categoriserDecisionWithFormResponse({
          bookingId: bookingInt,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          userId: req.user.username,
          transactionalClient: transactionalDbClient,
        })

        const nextReviewDate = R.path(['formObject', 'ratings', 'nextReviewDate', 'date'], formData)

        await offendersService.createOrUpdateCategorisation({
          context: res.locals,
          bookingId: bookingInt,
          overriddenCategory: userInput.overriddenCategory,
          suggestedCategory: userInput.suggestedCategory,
          overriddenCategoryText: userInput.overriddenCategoryText || 'Cat-tool Initial',
          nextReviewDate,
          nomisSeq: formData.nomisSeq,
          transactionalDbClient,
        })

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
        const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

        if (userInput.catType === CatType.RECAT.name) {
          const categorisations = await offendersService.getPrisonerBackground(
            res.locals,
            categorisationRecord.offenderNo
          )
          const dataToStore = {
            catHistory: categorisations,
          }

          await formService.mergeRiskProfileData(bookingId, dataToStore, transactionalDbClient)
        }

        await offendersService.createSupervisorApproval(res.locals, bookingId, userInput)

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        // persist the open conditions override and return to categoriser to complete the open conditions route.
        log.info(`Supervisor overriding to Category ${userInput.supervisorOverriddenCategory}`)
        await formService.update({
          bookingId: parseInt(bookingId, 10),
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          transactionalClient: transactionalDbClient,
          logUpdate: true,
        })
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)

        const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
        const { formObject } = categorisationRecord
        const formObjectWithMessageText = R.assocPath(
          ['supervisor', 'confirmBack', 'messageText'],
          userInput.supervisorOverriddenCategoryText,
          formObject
        )

        // Reset cat so it appears the categoriser originally chose open conditions!
        if (userInput.catType === CatType.INITIAL.name) {
          const newData = R.assocPath(
            ['categoriser', 'provisionalCategory'],
            {
              suggestedCategory: userInput.supervisorOverriddenCategory,
              categoryAppropriate: 'Yes',
              otherInformationText: formObject.categoriser.provisionalCategory.otherInformationText,
            },
            formObjectWithMessageText
          )
          await formService.updateFormData(bookingId, newData, transactionalDbClient)
        } else {
          await formService.updateFormData(bookingId, formObjectWithMessageText, transactionalDbClient)

          // delete recat decision to force a new decision once open conditions completed
          await formService.deleteFormData({
            bookingId: parseInt(bookingId, 10),
            formSection: 'recat',
            formName: 'decision',
            transactionalClient: transactionalDbClient,
          })
        }

        // send back to the categoriser for open conditions completion
        await offendersService.backToCategoriser(res.locals, bookingId, transactionalDbClient)
        res.redirect(`/supervisorHome`)
      }
    })
  )

  router.post(
    '/cancel/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const formPageConfig = formConfig.cancel
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/cancel/${bookingId}`, userInput)
      if (!valid) {
        return
      }
      if (userInput.confirm === 'Yes') {
        await offendersService.setInactive(res.locals, bookingId, 'PENDING')

        const categorisationRecord = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
        await formService.cancel({
          bookingId: parseInt(bookingId, 10),
          offenderNo: categorisationRecord.offenderNo,
          userId: res.locals.user && res.locals.user.username,
          transactionalClient: transactionalDbClient,
        })

        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        res.redirect(userInput.referer || '/')
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
