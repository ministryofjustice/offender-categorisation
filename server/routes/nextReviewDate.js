const express = require('express')
const flash = require('connect-flash')
const { firstItem, extractNextReviewDate } = require('../utils/functionalHelpers')
const { calculateNextReviewDate, dateConverter, dateConverterToISO } = require('../utils/utils')
const { handleCsrf, getPathFor } = require('../utils/routes')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')
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
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const { nextDateChoice } = req.query
      const form = 'nextReviewDate'
      const result = await buildFormData(res, req, false, form, bookingId, true, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, { ...result, date: calculateNextReviewDate(nextDateChoice) })
    })
  )

  router.get(
    '/nextReviewDateStandalone/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'nextReviewDateStandalone'
      const result = await buildFormData(res, req, true, form, bookingId, false, transactionalDbClient)
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
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const form = 'nextReviewDateStandaloneConfirmed'
      const result = await buildFormData(res, req, true, form, bookingId, false, transactionalDbClient)
      res.render(`pages/nextReviewDateStandaloneConfirmed`, result)
    })
  )

  router.get(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const result = await buildFormData(res, req, false, form, bookingId, true, transactionalDbClient)
      res.render(`formPages/nextReviewDate/${form}`, result)
    })
  )

  const buildFormData = async (res, req, standalone, form, bookingId, strict, transactionalDbClient) => {
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals.user }

    const formData = await formService.getCategorisationRecord(bookingId, transactionalDbClient)
    if (strict && !formData.formObject) {
      throw new Error('No categorisation found for this booking id')
    }
    res.locals.formObject = { ...formData.formObject, ...formData.riskProfile }
    res.locals.formId = formData.id

    const backLink = req.get('Referrer')
    let section
    if (standalone) {
      section = 'nextReviewDate'
    } else {
      section = formData.catType === 'RECAT' ? 'recat' : 'ratings'
    }
    const pageData = res.locals.formObject
    if (!pageData[section]) {
      pageData[section] = {}
    }
    pageData[section][form] = { ...pageData[section][form], ...firstItem(req.flash('userInput')) }

    const errors = req.flash('errors')
    const details = await offendersService.getOffenderDetails(res.locals, bookingId)
    const nomisDate = dateConverter(extractNextReviewDate(details))
    const date = standalone
      ? nomisDate
      : pageData[section] && pageData[section].nextReviewDate && pageData[section].nextReviewDate.date

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

  const clearConditionalFields = body => ({ ...body })

  router.post(
    '/nextReviewDateQuestion/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
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
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      res.redirect(`/tasklistRecat/${req.params.bookingId}`)
    })
  )

  router.get('/nextReviewDateQuestion/:bookingId', (req, res) => {
    res.send('Handling nextReviewDateQuestion...')
  })

  router.get('/nextReviewDate/:bookingId', (req, res) => {
    res.send('Handling nextReviewDate...')
  })

  // FIXME: This route (`/:form/:bookingId`) conflicts with `server/routes/form.js`
  // because `server/routes/form.js` uses a more general wildcard pattern (`/:section/:form/:bookingId`).
  //
  // ⚠️ Wildcard routes (`/:form/:bookingId`) can cause unintended route matching issues
  // and override more specific routes.
  //
  // 🔹 Suggested Fix:
  // 1️⃣ Investigate how `server/routes/form.js` handles routes and ensure it doesn't conflict.
  // 2️⃣ Move `nextReviewDate` routes into `server/routes/nextReviewDate.js` and register it as a sub-router in `server/routes/form.js`.
  // 3️⃣ Instead of a catch-all wildcard, explicitly define routes in `nextReviewDate.js`:
  //
  //    router.get('/nextReviewDateQuestion/:bookingId', handler);
  //    router.get('/nextReviewDate/:bookingId', handler);
  //
  // 4️⃣ Add a **fallback route** at the end of `server/routes/form.js` to catch unrecognized URLs:
  //
  //    router.use((req, res) => {
  //      res.status(404).send('Url not recognised');
  //    });
  //
  // This approach **stops overlapping** and ensures each module handles only its relevant routes.
  router.post(
    '/:form/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { form, bookingId } = req.params
      const section = 'nextReviewDate'
      const formPageConfig = formConfig[section][form]
      const userInput = clearConditionalFields(req.body)

      const valid = formService.isValid(formPageConfig, req, res, `/form/${section}/${form}/${bookingId}`, userInput)
      if (!valid) {
        return
      }

      if (form === 'nextReviewDateStandalone') {
        // Handle the possibility that there is no Postgres form entry: still allow Nomis update for standalone

        const details = await offendersService.getOffenderDetails(res.locals, bookingId)

        await formService.recordNextReview(
          res.locals,
          {
            bookingId,
            offenderNo: details.offenderNo,
            nextReviewDate: dateConverterToISO(userInput.date),
            reason: userInput.reason,
          },
          transactionalDbClient
        )

        await offendersService.updateNextReviewDate(res.locals, bookingId, userInput.date)
      } else if (userInput.catType) {
        // Only update the json when categorising; it is a snapshot
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

      const nextPath = getPathFor({ data: userInput, config: formPageConfig })
      res.redirect(`${nextPath}${bookingId}`)
    })
  )

  return router
}
