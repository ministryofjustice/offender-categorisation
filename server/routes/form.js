const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const moment = require('moment')
const joi = require('joi')
const log = require('../../log')

const { firstItem } = require('../utils/functionalHelpers')
const { getLongDateFormat, isFemalePrisonId } = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')
const Status = require('../utils/statusEnum')

const ratings = require('../config/ratings')
const categoriser = require('../config/categoriser')
const supervisor = require('../config/supervisor')
const security = require('../config/security')
const openConditions = require('../config/openConditions')
const cancel = require('../config/cancel')

const CatType = require('../utils/catTypeEnum')
const {
  CATEGORY,
  OPEN_CONDITIONS_CATEGORIES,
  SUPERVISOR_DECISION_REQUEST_MORE_INFORMATION,
  SUPERVISOR_DECISION_CHANGE_TO,
  SUPERVISOR_DECISION_AGREE,
} = require('../data/categories')
const { mapDataToViolenceProfile } = require('../utils/violenceProfile/violenceProfileMapper')
const asyncMiddleware = require('../middleware/asyncMiddleware').default

const SECURITY_BUTTON_SUBMIT = 'submit'
const SECURITY_BUTTON_RETURN = 'return'

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
  authenticationMiddleware,
  pathfinderService,
  alertService,
}) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use(handleCsrf)

  router.get(
    '/ratings/offendingHistory/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'offendingHistory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const history = await offendersService.getCatAInformation(res.locals, result.data.details.offenderNo, bookingId)
      const offences = await offendersService.getOffenceHistory(res.locals, result.data.details.offenderNo)
      const data = { ...result.data, history, offences }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    }),
  )

  router.get(
    '/ratings/securityInput/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  router.get(
    '/ratings/violenceRating/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'violenceRating'
      const { bookingId } = req.params

      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)

      const [assaultIncidents, viper] = await Promise.all([
        offendersService.getCountOfAssaultIncidents(res.locals, result.data.details.offenderNo),
        formService.getViperData(req.user.username, result.data.details.offenderNo),
      ])

      const data = { ...result.data, ...assaultIncidents, viper }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    }),
  )

  router.get(
    '/ratings/escapeRating/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'escapeRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const escapeProfile = await alertService.getEscapeProfile(result.data.details.offenderNo, res.locals)
      const data = { ...result.data, escapeProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    }),
  )

  router.get(
    '/ratings/extremismRating/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'extremismRating'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const extremismProfile = await pathfinderService.getExtremismProfile(result.data.details.offenderNo, res.locals)
      const data = { ...result.data, extremismProfile }
      res.render(`formPages/${section}/${form}`, { ...result, data })
    }),
  )

  router.get(
    '/categoriser/provisionalCategory/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  router.get(
    '/categoriser/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'categoriser', 'review', bookingId, transactionalDbClient)

      const [history, offences, extremismProfile, escapeProfile, assaultIncidents, viper, hasLifeSentence] =
        await Promise.all([
          offendersService.getCatAInformation(res.locals, result.data.details.offenderNo, bookingId),
          offendersService.getOffenceHistory(res.locals, result.data.details.offenderNo),
          pathfinderService.getExtremismProfile(result.data.details.offenderNo, res.locals),
          alertService.getEscapeProfile(result.data.details.offenderNo, res.locals),
          offendersService.getCountOfAssaultIncidents(res.locals, result.data.details.offenderNo),
          formService.getViperData(req.user.username, result.data.details.offenderNo),
          offendersService.hasLifeSentence(res.locals, parseInt(bookingId, 10)),
        ])

      const violenceProfile = mapDataToViolenceProfile(viper, assaultIncidents)

      const dataToStore = {
        history,
        offences,
        escapeProfile,
        extremismProfile,
        violenceProfile,
        lifeProfile: {
          life: hasLifeSentence,
        },
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
    }),
  )

  router.get(
    '/supervisor/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  router.get(
    '/supervisor/further-information/:bookingId',
    asyncMiddleware(async (req, res) => {
      const result = await buildFormData(res, req, 'supervisor', 'review', req.params.bookingId)
      res.render('formPages/supervisor/furtherInformation', result)
    }),
  )

  router.get(
    '/supervisor/change-category/:bookingId',
    asyncMiddleware(async (req, res) => {
      const result = await buildFormData(res, req, 'supervisor', 'review', req.params.bookingId)
      res.render('formPages/supervisor/changeCategory', result)
    }),
  )

  router.get(
    '/security/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'security'
      const result = await buildFormData(res, req, section, 'review', bookingId, transactionalDbClient)
      const securityReferral = await getSecurityReferral(
        res.locals,
        result.data.details.offenderNo,
        transactionalDbClient,
      )
      res.render(`formPages/security/review`, { ...result, securityReferred: { ...securityReferral } })
    }),
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
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { section, form, bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      res.render(`formPages/${section}/${form}`, result)
    }),
  )

  router.get(
    '/awaitingApprovalView/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient)

      if (result.catType === CatType.INITIAL.name) {
        res.render('formPages/categoriser/awaitingApprovalView', result)
      } else {
        const categorisations = await offendersService.getPrisonerBackground(res.locals, result.data.details.offenderNo)
        const data = { ...result.data, categorisations }
        res.render('formPages/recat/awaitingApprovalView', { ...result, data })
      }
    }),
  )

  router.get(
    '/approvedView/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const { sequenceNo } = req.query
      const result = await buildFormData(res, req, 'dummy1', 'dummy2', bookingId, transactionalDbClient, sequenceNo)
      const prisonDescription = await offendersService.getOptionalAssessmentAgencyDescription(
        res.locals,
        result.prisonId,
      )
      const approvalDateDisplay = getLongDateFormat(result.approvalDate)
      if (result.catType === CatType.INITIAL.name) {
        res.render(`formPages/approvedView`, { ...result, approvalDateDisplay, prisonDescription })
      } else {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals,
          result.data.details.offenderNo,
          result.approvalDate,
        )
        const data = { ...result.data, categorisations }
        res.render(`formPages/recat/approvedView`, { ...result, data, approvalDateDisplay, prisonDescription })
      }
    }),
  )

  router.get(
    '/cancel/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const result = await buildFormData(res, req, 'dummy1', 'cancel', bookingId, transactionalDbClient)
      const { referer } = req.headers
      const categorisations =
        result.catType === CatType.RECAT.name
          ? await offendersService.getPrisonerBackground(res.locals, result.data.details.offenderNo)
          : null
      const data = { ...result.data, categorisations, referer }
      res.render('formPages/cancel', { ...result, data })
    }),
  )

  router.get(
    '/cancelConfirmed/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const { bookingId } = req.params
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)

      res.render('pages/cancelConfirmed', { data: { details } })
    }),
  )

  const buildFormData = async (res, req, section, form, bookingId, transactionalDbClient, sequenceNo, userDetails) => {
    const user = userDetails || (await userService.getUser(res.locals))
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
      isInWomensEstate: isFemalePrisonId(details.prisonId),
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
    const updated = { ...body }
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
    if (body.justification === '') {
      delete updated.justification
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
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
        transactionalDbClient,
      )

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    }),
  )

  router.post(
    '/ratings/securityBack/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'ratings'
      const form = 'securityBack'
      const { bookingId } = req.params
      const formPageConfig = formConfig[section][form]

      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const isFemale = isFemalePrisonId(details.prisonId)
      const userInput = clearConditionalFields(req.body)

      if (
        !isFemale &&
        !formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      ) {
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

  router.post(
    '/supervisor/confirmBack/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'supervisor'
      const form = 'confirmBack'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const newData = R.assocPath(['supervisor', 'confirmBack', 'isRead'], false, userInput)

      const newFormData = await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: newData,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      if (OPEN_CONDITIONS_CATEGORIES.includes(newFormData?.supervisor?.review?.supervisorOverriddenCategory)) {
        if (newFormData.recat) {
          await formService.deleteFormData({
            bookingId: parseInt(bookingId, 10),
            formSection: 'recat',
            formName: 'decision',
            transactionalClient: transactionalDbClient,
          })
        } else {
          const existingCatDecision = R.path(['ratings', 'decision'], newFormData)
          const updatedFormResponse = R.assocPath(
            ['categoriser', 'provisionalCategory'],
            {
              suggestedCategory: userInput.supervisorOverriddenCategory,
              categoryAppropriate: 'Yes',
              otherInformationText: newFormData.categoriser.provisionalCategory.otherInformationText,
              justification: newFormData.categoriser.provisionalCategory.justification,
            },
            newFormData,
          )
          // delete ratings.decision if present
          if (existingCatDecision) {
            delete updatedFormResponse.ratings.decision
          }
          await formService.updateFormData(bookingId, updatedFormResponse, transactionalDbClient)
        }
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)
      }

      await offendersService.backToCategoriser(res.locals, bookingId, transactionalDbClient)

      const nextPath = '/tasklist/supervisor/sent-back-to-categoriser/'
      const catTypeArgument = userInput.catType ? `?catType=${userInput.catType}` : ''
      res.redirect(`${nextPath}${bookingId}${catTypeArgument}`)
    }),
  )

  router.post(
    '/supervisor/supervisorMessage/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const categorisationRecord = await formService.backToCategoriserMessageRead(bookingId, transactionalDbClient)

      const nextPath =
        categorisationRecord.catType === 'INITIAL' ? `/tasklist/${bookingId}` : `/tasklistRecat/${bookingId}`
      res.redirect(`${nextPath}`)
    }),
  )

  router.post(
    '/security/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const { bookingId } = req.params
      const validation = joi
        .object({
          button: joi.string().valid(SECURITY_BUTTON_SUBMIT, SECURITY_BUTTON_RETURN).required(),
          securityReview: joi.string().required().max(50000).messages({
            'string.empty': 'Enter security information',
            'string.max': 'Security information must be 50000 characters or less',
          }),
        })
        .validate(req.body, { stripUnknown: true, abortEarly: false })
      if (validation.error) {
        req.flash(
          'errors',
          validation.error.details.map(error => ({
            text: error.message,
            href: `#${error.context.label}`,
          })),
        )
        req.flash('userInput', validation.value)
        res.redirect(`/form/security/review/${bookingId}`)
        return
      }

      try {
        await formService.securityReviewed(
          bookingId,
          req.user.username,
          validation.value.button === SECURITY_BUTTON_SUBMIT,
          validation.value.securityReview,
        )
      } catch (error) {
        res.render('pages/error', {
          message: 'Failed to submit security review',
        })
      }
      res.redirect('/')
    }),
  )

  router.post(
    '/categoriser/provisionalCategory/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  router.post(
    '/supervisor/review/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const userInput = clearConditionalFields(req.body)
      const categorisationRecord = await formService.getCategorisationRecord(bookingId)
      const currentCategory =
        R.path(['formObject', 'categoriser', 'provisionalCategory', 'overriddenCategory'], categorisationRecord) ??
        R.path(['formObject', 'categoriser', 'provisionalCategory', 'suggestedCategory'], categorisationRecord)

      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const isYoungOffender = formService.isYoungOffender(details)
      const isInWomensEstate = isFemalePrisonId(details.prisonId)

      const validSupervisorDecisionValues = [SUPERVISOR_DECISION_AGREE, SUPERVISOR_DECISION_REQUEST_MORE_INFORMATION]
      if (isYoungOffender) {
        if (currentCategory !== CATEGORY.I) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.I)
        }
        if (currentCategory !== CATEGORY.J) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.J)
        }
      }
      if (isInWomensEstate) {
        if (currentCategory !== CATEGORY.T) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.T)
        }
        if (currentCategory !== CATEGORY.R) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.R)
        }
      } else {
        if (currentCategory !== CATEGORY.B) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.B)
        }
        if (currentCategory !== CATEGORY.C) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.C)
        }
        if (currentCategory !== CATEGORY.D) {
          validSupervisorDecisionValues.push(SUPERVISOR_DECISION_CHANGE_TO + CATEGORY.D)
        }
      }

      const validation = joi
        .object({
          supervisorDecision: joi
            .string()
            .valid(...validSupervisorDecisionValues)
            .required()
            .messages({ 'any.required': 'Select what you would like to do next' }),
        })
        .validate(userInput, { stripUnknown: true, abortEarly: false })

      if (validation.error) {
        req.flash(
          'errors',
          validation.error.details.map(error => ({
            text: error.message,
            href: `#${error.context.label}`,
          })),
        )
        return res.redirect(`/form/supervisor/review/${bookingId}`)
      }

      const section = 'supervisor'
      const form = 'review'
      const formPageConfig = formConfig[section][form]

      let redirectUrl = `/form/supervisor/review/${bookingId}`
      const formResponseChanges = {
        ...validation.value,
      }

      if (validation.value.supervisorDecision === SUPERVISOR_DECISION_AGREE) {
        redirectUrl = `/form/supervisor/further-information/${bookingId}`
      }
      if (validation.value.supervisorDecision === SUPERVISOR_DECISION_REQUEST_MORE_INFORMATION) {
        redirectUrl = `/form/supervisor/confirmBack/${bookingId}`
      }
      if (validation.value.supervisorDecision.startsWith(SUPERVISOR_DECISION_CHANGE_TO)) {
        const overrideCategory = formService.getCategoryFromSupervisorDecisionString(
          validation.value.supervisorDecision,
        )
        if (OPEN_CONDITIONS_CATEGORIES.includes(overrideCategory)) {
          redirectUrl = `/form/supervisor/confirmBack/${bookingId}`
        } else {
          redirectUrl = `/form/supervisor/change-category/${bookingId}`
        }
        formResponseChanges.supervisorOverriddenCategory = formService.getCategoryFromSupervisorDecisionString(
          validation.value.supervisorDecision,
        )
        formResponseChanges.supervisorCategoryAppropriate = 'No'
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: formResponseChanges,
        formSection: section,
        formName: form,
        logUpdate: true,
      })

      return res.redirect(redirectUrl)
    }),
  )

  router.post(
    '/supervisor/further-information/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const userInput = clearConditionalFields(req.body)

      const section = 'supervisor'
      const form = 'furtherInformation'
      const formPageConfig = formConfig[section][form]

      await formService.supervisorApproval({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput,
        formSection: section,
        formName: form,
      })
      const categorisationRecord = await formService.getCategorisationRecord(bookingId)

      if (userInput.catType === CatType.RECAT.name) {
        const categorisations = await offendersService.getPrisonerBackground(
          res.locals,
          categorisationRecord.offenderNo,
        )
        const dataToStore = {
          catHistory: categorisations,
        }

        await formService.mergeRiskProfileData(bookingId, dataToStore)
      }

      await offendersService.createSupervisorApproval(res.locals, bookingId, userInput)

      const nextPath = getPathFor({ data: req.body, config: formPageConfig })
      const catTypeArgument = userInput.catType ? `?catType=${userInput.catType}` : ''
      res.redirect(`${nextPath}${bookingId}${catTypeArgument}`)
    }),
  )

  router.post(
    '/supervisor/change-category/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      const validation = joi
        .object({
          giveBackToCategoriser: joi
            .string()
            .valid('Yes', 'No')
            .required()
            .messages({ 'any.required': 'Select if you want to send the review back the categoriser' }),
          supervisorOverriddenCategoryText: joi.when('giveBackToCategoriser', {
            is: 'No',
            then: joi.string().trim().required().messages({
              'any.required': 'Enter the reason why this category is more appropriate',
              'string.empty': 'Enter the reason why this category is more appropriate',
            }),
          }),
        })
        .validate(req.body, { stripUnknown: true, abortEarly: false })

      if (validation.error) {
        req.flash(
          'errors',
          validation.error.details.map(error => ({
            text: error.message,
            href: `#${error.context.label}`,
          })),
        )

        const result = await buildFormData(res, req, 'supervisor', 'review', req.params.bookingId)
        return res.render('formPages/supervisor/changeCategory', {
          ...result,
          giveBackToCategoriser: validation.value.giveBackToCategoriser,
        })
      }

      const section = 'supervisor'
      const form = 'changeCategory'
      const formPageConfig = formConfig[section][form]
      const dataToStore = {
        giveBackToCategoriser: validation.value.giveBackToCategoriser,
      }
      if (dataToStore.giveBackToCategoriser === 'No') {
        dataToStore.supervisorOverriddenCategoryText = validation.value.supervisorOverriddenCategoryText
      }

      await formService.update({
        bookingId: parseInt(bookingId, 10),
        userId: req.user.username,
        config: formPageConfig,
        userInput: dataToStore,
        formSection: section,
        formName: form,
        logUpdate: true,
      })

      if (validation.value.giveBackToCategoriser === 'Yes') {
        return res.redirect(`/form/supervisor/confirmBack/${bookingId}`)
      }
      return res.redirect(`/form/supervisor/further-information/${bookingId}`)
    }),
  )

  router.post(
    '/cancel/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  router.post(
    '/ratings/decision/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const { bookingId } = req.params
      const section = 'ratings'
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

      if (userInput.category === 'T' || userInput.category === 'J') {
        await formService.requiresOpenConditions(bookingId, req.user.username, transactionalDbClient)
        res.redirect(`/openConditionsAdded/${bookingId}?catType=INITIAL`)
      } else {
        await formService.cancelOpenConditions(bookingIdInt, req.user.username, transactionalDbClient)
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    }),
  )
  router.post(
    '/categoriser/review/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'categoriser'
      const form = 'review'
      const formPageConfig = formConfig[section][form]
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const details = await offendersService.getOffenderDetails(res.locals, bookingId)
      const isFemale = isFemalePrisonId(details.prisonId)
      if (!isFemale) {
        // if male prison, update data and redirect to provisional category page
        const userInput = clearConditionalFields(req.body)
        // validation is not needed
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
      } else {
        // if female prison, save and submit data
        const bookingInt = parseInt(bookingId, 10)
        const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

        const suggestedCategory = R.path(['formObject', 'ratings', 'decision', 'category'], formData)
        if (suggestedCategory) {
          log.info(`Categoriser creating categorisation record:`)
          const provisionalCategoryFormPageConfig = formConfig.categoriser.provisionalCategory
          const provisionalCategoryUserInput = {
            suggestedCategory,
            categoryAppropriate: 'Yes',
          }
          await formService.categoriserDecisionWithFormResponse({
            bookingId: bookingInt,
            config: provisionalCategoryFormPageConfig,
            userInput: provisionalCategoryUserInput,
            formSection: 'categoriser',
            formName: 'provisionalCategory',
            userId: req.user.username,
            transactionalClient: transactionalDbClient,
          })

          const nextReviewDate = R.path(['formObject', 'ratings', 'nextReviewDate', 'date'], formData)

          await offendersService.createOrUpdateCategorisation({
            context: res.locals,
            bookingId: bookingInt,
            suggestedCategory,
            overriddenCategoryText: 'Cat-tool Initial',
            nextReviewDate,
            nomisSeq: formData.nomisSeq,
            transactionalDbClient,
          })
          // skip provisional category page
          const nextPath = getPathFor({ data: req.body, config: provisionalCategoryFormPageConfig })
          res.redirect(`${nextPath}${bookingId}`)
        } else {
          throw new Error('category has not been specified')
        }
      }
    }),
  )

  router.post(
    '/:section/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
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
    }),
  )

  return router
}
