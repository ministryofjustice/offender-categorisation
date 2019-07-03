const express = require('express')
const flash = require('connect-flash')
const R = require('ramda')
const { firstItem } = require('../utils/functionalHelpers')
const { getPathFor } = require('../utils/routes')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const openConditions = require('../config/openConditions')
const categoriser = require('../config/categoriser')
const Status = require('../utils/statusEnum')
const log = require('../../log')

const formConfig = {
  openConditions,
  categoriser,
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
    '/furtherCharges/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'furtherCharges'
      const result = await buildFormData(res, req, 'openConditions', form, bookingId, transactionalDbClient)

      // Copy offending history charges or skip ?
      const textExists =
        result.data.openConditions &&
        result.data.openConditions.furtherCharges &&
        result.data.openConditions.furtherCharges.furtherChargesText

      const furtherChargesExists =
        result.data.ratings &&
        result.data.ratings.furtherCharges &&
        result.data.ratings.furtherCharges.furtherCharges === 'Yes'

      if (!furtherChargesExists && !textExists && result.catType === 'INITIAL') {
        const formPageConfig = formConfig.openConditions[form]
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else if (furtherChargesExists && !textExists) {
        const newResult = R.assocPath(
          ['data', 'openConditions', 'furtherCharges', 'furtherChargesText'],
          result.data.ratings.furtherCharges.furtherChargesText,
          result
        )
        res.render(`formPages/openConditions/${form}`, newResult)
      } else {
        res.render(`formPages/openConditions/${form}`, result)
      }
    })
  )

  router.get(
    '/provisionalCategory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'categoriser'
      const form = 'provisionalCategory'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)
      const openConditionsSuggestedCat = formService.isYoungOffender(result.data.details) ? 'J' : 'D'
      const data = { ...result.data, openConditionsSuggestedCat }

      res.render(`formPages/openConditions/provisionalCategory`, { ...result, data })
    })
  )

  router.get(
    '/openConditionsNotSuitable/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const section = 'openConditions'
      const form = 'openConditionsNotSuitable'
      const { bookingId } = req.params
      const result = await buildFormData(res, req, section, form, bookingId, transactionalDbClient)

      if (result.data.openConditions.earliestReleaseDate.justify === 'No') {
        res.render('formPages/openConditions/openConditionsNotSuitable', {
          warningText:
            'This person cannot be sent to open conditions because they have more than three years to their' +
            ' earliest release date and there are no special circumstances to warrant them moving into open conditions',
          ...result,
        })
      } else if (result.data.openConditions.foreignNational.formCompleted === 'No') {
        res.render('formPages/openConditions/openConditionsNotSuitable', {
          warningText: 'This person cannot be sent to open conditions without a CCD3 form',
          ...result,
        })
      } else if (result.data.openConditions.foreignNational.exhaustedAppeal === 'Yes') {
        res.render('formPages/openConditions/openConditionsNotSuitable', {
          warningText:
            'This person cannot be sent to open conditions because they are due to be deported and have exhausted' +
            ' all appeal rights in the UK',
          ...result,
        })
      } else {
        throw new Error('No openConditionsNotSuitable warning condition')
      }
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, 'openConditions', form, bookingId, transactionalDbClient)
      res.render(`formPages/openConditions/${form}`, result)
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

    return {
      data: { ...pageData, details },
      formName: form,
      status: formData.status,
      catType: formData.catType,
      backLink,
      errors,
    }
  }

  const clearConditionalFields = body => {
    const updated = Object.assign({}, body)
    if (body.threeOrMoreYears === 'No') {
      delete updated.justify
      delete updated.justifyText
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
    return updated
  }

  router.post(
    '/riskLevels/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'riskLevels'
      const section = 'openConditions'
      const formPageConfig = formConfig.openConditions[form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
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

      const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
      const data = formData.formObject
      const oc = data.openConditions
      if (
        oc &&
        ((oc.riskOfHarm && oc.riskOfHarm.harmManaged === 'No') ||
          (oc.furtherCharges && oc.furtherCharges.increasedRisk === 'Yes') ||
          (oc.riskLevels && oc.riskLevels.likelyToAbscond === 'Yes'))
      ) {
        res.redirect(`/form/openConditions/notRecommended/${bookingId}`)
      } else {
        const nextPath = getPathFor({ data: req.body, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    })
  )

  router.post(
    '/notRecommended/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'openConditions'
      const form = 'notRecommended'
      const formPageConfig = formConfig.openConditions[form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      const userInput = clearConditionalFields(req.body)
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
    })
  )

  /* The provisional category data is persisted against the categoriser section to avoid
   * cat data being stored in separate locations */
  router.post(
    '/provisionalCategory/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const section = 'categoriser' // persisting the categorisation data in one place
      const form = 'provisionalCategory'
      const formPageConfig = formConfig[section][form]
      const sectionForValidation = 'openConditions' // validation uses open conditions config to return to open conditions on validation failure
      const formPageConfigForValidation = formConfig.openConditions[form]

      if (!formService.isValid(formPageConfigForValidation, req, res, sectionForValidation, form, bookingId)) {
        return
      }

      const bookingInt = parseInt(bookingId, 10)

      const userInput = clearConditionalFields(req.body)

      if (userInput.openConditionsCategoryAppropriate === 'Yes') {
        log.info(`Categoriser creating initial categorisation record:`)
        await formService.update({
          bookingId: bookingInt,
          userId: req.user.username,
          config: formPageConfig,
          userInput,
          formSection: section,
          formName: form,
          status: Status.AWAITING_APPROVAL.name,
          transactionalClient: transactionalDbClient,
          logUpdate: true,
        })

        const nomisKeyMap = await offendersService.createInitialCategorisation({
          token: res.locals.user.token,
          bookingId,
          suggestedCategory: userInput.openConditionsSuggestedCategory,
          overriddenCategoryText: userInput.overriddenCategoryText,
        })

        await formService.recordNomisSeqNumber(bookingInt, nomisKeyMap.sequenceNumber, transactionalDbClient)

        const nextPath = getPathFor({ data: userInput, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      } else {
        // if user selects no - clear provisional cat data and cancel open conditions
        await formService.cancelOpenConditions(bookingInt, req.user.username, transactionalDbClient)
        res.redirect(`/tasklist/${bookingId}`)
      }
    })
  )

  router.post(
    '/:form/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const userId = req.user.username
      const section = 'openConditions'
      const formPageConfig = formConfig.openConditions[form]

      if (!formService.isValid(formPageConfig, req, res, section, form, bookingId)) {
        return
      }

      const userInput = clearConditionalFields(req.body)
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

      if (userInput.justify === 'No' || userInput.formCompleted === 'No' || userInput.exhaustedAppeal === 'Yes') {
        await formService.cancelOpenConditions(bookingIdInt, userId, transactionalDbClient)
        res.redirect(`/form/openConditions/openConditionsNotSuitable/${bookingId}`)
      } else {
        const nextPath = getPathFor({ data: userInput, config: formPageConfig })
        res.redirect(`${nextPath}${bookingId}`)
      }
    })
  )

  return router
}
