const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const joi = require('joi')
const { firstItem } = require('../utils/functionalHelpers')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')
const openConditions = require('../config/openConditions')
const categoriser = require('../config/categoriser')
const log = require('../../log').default
const { isFemalePrisonId } = require('../utils/utils')
const logger = require('../../log').default

const formConfig = {
  openConditions,
  categoriser,
}

const NOT_SUITABLE_REASON_EARLIEST_RELEASE_DATE = 'EARLIEST_RELEASE_DATE'
const NOT_SUITABLE_REASON_VICTIM_CONTACT_SCHEME = 'VICTIM_CONTACT_SCHEME'
const NOT_SUITABLE_REASON_PREVIOUS_SENTENCES = 'PREVIOUS_SENTENCES'
const NOT_SUITABLE_FOREIGN_NATIONAL_FORM = 'FOREIGN_NATIONAL_FORM'
const NOT_SUITABLE_FOREIGN_NATIONAL_EXHAUSTED_APPEALS = 'FOREIGN_NATIONAL_EXHAUSTED_APPEALS'

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use(handleCsrf)

  router.get(
    '/furtherCharges/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'furtherCharges'
      let result = await buildFormData(res, req, 'openConditions', form, bookingId, transactionalDbClient)

      // Copy offending history charges or skip ?
      const openConditionsFCTextExists =
        result.data.openConditions &&
        result.data.openConditions.furtherCharges &&
        result.data.openConditions.furtherCharges.furtherChargesText

      const furtherChargesMainJourneyExists =
        result.data.ratings &&
        result.data.ratings.furtherCharges &&
        result.data.ratings.furtherCharges.furtherCharges === 'Yes'

      if (furtherChargesMainJourneyExists && !openConditionsFCTextExists) {
        result = R.assocPath(
          ['data', 'openConditions', 'furtherCharges', 'furtherChargesText'],
          result.data.ratings.furtherCharges.furtherChargesText,
          result,
        )
      }

      res.render(`formPages/openConditions/${form}`, result)
    }),
  )

  router.get(
    '/provisionalCategory/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const section = 'categoriser'
      const form = 'provisionalCategory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      if (result.isInWomensEstate) {
        res.redirect(`/${result.catType === 'RECAT' ? 'tasklistRecat' : 'tasklist'}/${bookingId}`)
        return
      }
      const openConditionsSuggestedCat = formService.isYoungOffender(result.data.details) ? 'J' : 'D'
      const data = { ...result.data, openConditionsSuggestedCat }

      res.render(`formPages/openConditions/provisionalCategory`, { ...result, data })
    }),
  )

  router.get(
    '/openConditionsNotSuitable/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
      const validation = joi
        .object({
          reason: joi
            .valid(
              NOT_SUITABLE_REASON_EARLIEST_RELEASE_DATE,
              NOT_SUITABLE_REASON_VICTIM_CONTACT_SCHEME,
              NOT_SUITABLE_REASON_PREVIOUS_SENTENCES,
              NOT_SUITABLE_FOREIGN_NATIONAL_FORM,
              NOT_SUITABLE_FOREIGN_NATIONAL_EXHAUSTED_APPEALS,
            )
            .required(),
        })
        .validate(req.query, { stripUnknown: true, abortEarly: false })
      if (validation.error) {
        logger.error('Invalid reason for open conditions not suitable.', validation.error)
        res.render('pages/error', {
          message: 'Invalid not suitable for open conditions reason',
        })
      }

      let warningText = ''

      const featurePolicyChangeThreeToFiveEnabled = res.locals?.featureFlags?.three_to_five_policy_change
      const years = featurePolicyChangeThreeToFiveEnabled ? '5' : 'three'

      switch (validation.value.reason) {
        case NOT_SUITABLE_REASON_EARLIEST_RELEASE_DATE:
          warningText =
            `This person cannot be sent to open conditions because they have more than ${years} years to their` +
            ' earliest release date and there are no special circumstances to warrant them moving into open conditions'
          break
        case NOT_SUITABLE_REASON_VICTIM_CONTACT_SCHEME:
          warningText =
            'This person cannot be sent to open conditions because a victim of the crime has opted-in' +
            ' to the Victim Contact Scheme and the VLO has not been contacted.'
          break
        case NOT_SUITABLE_REASON_PREVIOUS_SENTENCES:
          warningText =
            'This person cannot be sent to open conditions because they have a previous sentence of 7 years or more' +
            ' that they were released from in the last 5 years.'
          break
        case NOT_SUITABLE_FOREIGN_NATIONAL_FORM:
          warningText = 'This person cannot be sent to open conditions without a CCD3 form'
          break
        case NOT_SUITABLE_FOREIGN_NATIONAL_EXHAUSTED_APPEALS:
          warningText =
            'This person cannot be sent to open conditions because they have a liability for deportation and have' +
            ' exhausted all appeal rights in the UK'
          break
        default:
          throw new Error('No openConditionsNotSuitable warning condition')
      }

      res.render('formPages/openConditions/openConditionsNotSuitable', {
        warningText,
        catType: formData.catType,
      })
    }),
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, 'openConditions', form, bookingId, transactionalDbClient)
      res.render(`formPages/openConditions/${form}`, result)
    }),
  )

  const buildFormData = async (res, req, section, form, bookingId, transactionalDbClient) => {
    const user = await userService.getUser(res.locals)
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
    const details = await offendersService.getOffenderDetails(res.locals, bookingId)
    const featurePolicyChangeThreeToFiveEnabled = res.locals?.featureFlags?.three_to_five_policy_change

    return {
      data: { ...pageData, details },
      isInWomensEstate: isFemalePrisonId(details.prisonId),
      formName: form,
      status: formData.status,
      catType: formData.catType,
      backLink,
      errors,
      featurePolicyChangeThreeToFiveEnabled,
    }
  }

  const clearConditionalFields = body => {
    const updated = { ...body }
    if (body.fiveOrMoreYears === 'No') {
      delete updated.justify
      delete updated.justifyText
    }
    if (body.releasedLastFiveYears === 'No') {
      delete updated.sevenOrMoreYears
    }
    if (body.canTheRiskBeManaged === 'No') {
      delete updated.howTheRiskCanBeManaged
    }
    if (body.haveTheyBeenEverConvicted === 'No') {
      delete updated.canTheRiskBeManaged
      delete updated.howTheRiskCanBeManaged
    }
    if (body.isForeignNational === 'No') {
      delete updated.formCompleted
      delete updated.dueDeported
      delete updated.exhaustedAppeal
    } else if (body.formCompleted === 'No') {
      delete updated.dueDeported
      delete updated.exhaustedAppeal
    } else if (body.dueDeported === 'No') {
      delete updated.exhaustedAppeal
    }
    if (body.seriousHarm === 'No') {
      delete updated.harmManaged
      delete updated.harmManagedText
    }
    if (body.furtherCharges === 'No') {
      delete updated.furtherChargesText
      delete updated.increasedRisk
    }
    if (body.likelyToAbscond === 'No') {
      delete updated.likelyToAbscondText
    }
    if (body.isOtherInformation === 'No') {
      delete updated.otherInformationText
    }
    if (body.categoryAppropriate === 'Yes') {
      delete updated.overriddenCategory
      delete updated.overriddenCategoryText
    }
    if (body.vcsOptedFor === 'No') {
      delete updated.contactedVLO
      delete updated.vloResponseText
    }
    if (body.contactedVLO === 'No') {
      delete updated.vloResponseText
    }
    return updated
  }

  router.post(
    '/riskLevels/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'riskLevels'
      const section = 'openConditions'
      const formPageConfig = formConfig.openConditions[form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
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

      const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
      const data = formData.formObject
      const oc = data.openConditions
      if (
        oc &&
        ((oc.sexualOffences &&
          oc.sexualOffences.haveTheyBeenEverConvicted === 'Yes' &&
          oc.sexualOffences.canTheRiskBeManaged === 'No') ||
          (oc.riskOfHarm && oc.riskOfHarm.harmManaged === 'No') ||
          (oc.furtherCharges && oc.furtherCharges.increasedRisk === 'Yes') ||
          (oc.riskLevels && oc.riskLevels.likelyToAbscond === 'Yes'))
      ) {
        res.redirect(`/form/openConditions/notRecommended/${bookingId}`)
      } else {
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    }),
  )

  router.post(
    '/notRecommended/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'openConditions'
      const form = 'notRecommended'
      const formPageConfig = formConfig.openConditions[form]
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
      if (userInput.stillRefer === 'No') {
        await formService.cancelOpenConditions(parseInt(bookingId, 10), req.user.username, transactionalDbClient)
      }
      const nextPath = getPathFor({ data: userInput, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    }),
  )

  /* The provisional category data is persisted against the categoriser section to avoid
   * cat data being stored in separate locations */
  router.post(
    '/provisionalCategory/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'categoriser' // persisting the categorisation data in one place
      const form = 'provisionalCategory'
      const formPageConfig = formConfig[section][form]
      const sectionForValidation = 'openConditions' // validation uses open conditions config to return to open conditions on validation failure
      const formPageConfigForValidation = formConfig.openConditions[form]
      const userInput = clearConditionalFields(req.body)

      if (
        !formService.isValid(
          formPageConfigForValidation,
          req,
          res,
          `/form/${sectionForValidation}/${form}/${bookingId}`,
          userInput,
        )
      ) {
        return
      }

      const bookingInt = parseInt(bookingId, 10)

      if (userInput.openConditionsCategoryAppropriate === 'Yes') {
        const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)

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

        const nextReviewDate = R.path(['formObject', 'ratings', 'nextReviewDate', 'date'], formData)

        await offendersService.createOrUpdateCategorisation({
          context: res.locals,
          bookingId: bookingInt,
          suggestedCategory: userInput.openConditionsSuggestedCategory,
          overriddenCategoryText: userInput.overriddenCategoryText || 'Cat-tool Open',
          nextReviewDate,
          nomisSeq: formData.nomisSeq,
          transactionalDbClient,
        })

        const nextPath = getPathFor({ data: userInput, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        // if user selects no - clear provisional cat data and cancel open conditions
        await formService.cancelOpenConditions(bookingInt, req.user.username, transactionalDbClient)
        res.redirect(`/tasklist/${bookingId}`)
      }
    }),
  )

  router.post(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const userId = req.user.username
      const section = 'openConditions'
      const formPageConfig = formConfig.openConditions[form]
      const userInput = clearConditionalFields(req.body)

      if (!formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)) {
        return
      }

      const bookingIdInt = parseInt(bookingId, 10)
      await formService.update({
        bookingId: bookingIdInt,
        userId,
        config: formPageConfig,
        userInput,
        formSection: section,
        formName: form,
        transactionalClient: transactionalDbClient,
      })

      if (
        userInput.justify === 'No' ||
        userInput.contactedVLO === 'No' ||
        userInput.formCompleted === 'No' ||
        userInput.exhaustedAppeal === 'Yes' ||
        userInput.sevenOrMoreYears === 'Yes'
      ) {
        await formService.cancelOpenConditions(bookingIdInt, userId, transactionalDbClient)
        res.redirect(
          `/form/openConditions/openConditionsNotSuitable/${bookingId}?reason=${calculateNotSuitableForOpenConditionsReason(userInput)}`,
        )
      } else {
        const nextPath = getPathFor({ data: userInput, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    }),
  )

  const calculateNotSuitableForOpenConditionsReason = userInput => {
    if (userInput.justify === 'No') {
      return NOT_SUITABLE_REASON_EARLIEST_RELEASE_DATE
    }
    if (userInput.contactedVLO === 'No') {
      return NOT_SUITABLE_REASON_VICTIM_CONTACT_SCHEME
    }
    if (userInput.formCompleted === 'No') {
      return NOT_SUITABLE_FOREIGN_NATIONAL_FORM
    }
    if (userInput.exhaustedAppeal === 'Yes') {
      return NOT_SUITABLE_FOREIGN_NATIONAL_EXHAUSTED_APPEALS
    }
    if (userInput.sevenOrMoreYears === 'Yes') {
      return NOT_SUITABLE_REASON_PREVIOUS_SENTENCES
    }
    throw new Error('No valid openConditionsNotSuitable reason')
  }

  return router
}
