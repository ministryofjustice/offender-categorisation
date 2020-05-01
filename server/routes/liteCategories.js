const express = require('express')
const moment = require('moment')
const flash = require('connect-flash')
const baseJoi = require('joi')
const dateExtend = require('joi-date-extensions')
const { calculateNextReviewDate, sanitisePrisonName } = require('../utils/utils')
const { handleCsrf } = require('../utils/routes')
const validation = require('../utils/fieldValidation')
const asyncMiddleware = require('../middleware/asyncMiddleware')

const joi = baseJoi.extend(dateExtend)

/**
 * 'Lite' categorisation is simply a P-Nomis style workflow for any cats other than B/C/D/I/J.
 * This renders it unnecessary to go to P-Nomis for category assessments at all.
 */

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())
  router.use(handleCsrf)

  router.get(
    '/approveList',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const offenders = await offendersService.getUnapprovedLite(res.locals, transactionalDbClient)
      res.render(`pages/supervisorLite`, { offenders })
    })
  )

  router.get(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const [details, categorisationRecord, existingData, prisonListFromApi] = await Promise.all([
        offendersService.getBasicOffenderDetails(res.locals, bookingId),
        formService.getCategorisationRecord(bookingId, transactionalDbClient),
        formService.getLiteCategorisation(bookingId, transactionalDbClient),
        offendersService.getAgencies(res.locals),
      ])
      const liteInProgress = existingData.bookingId && !existingData.approvedDate

      const prisonList = [
        {},
        ...prisonListFromApi.map(p => ({ value: p.agencyId, text: sanitisePrisonName(p.description) })),
      ]

      res.render(`pages/liteCategories`, {
        bookingId,
        errors: [],
        liteInProgress,
        prisonList,
        nextReviewDate: calculateNextReviewDate('6'),
        data: { details, status: categorisationRecord.status },
      })
    })
  )

  router.get(
    '/confirmed/:bookingId',
    asyncMiddleware(async (req, res) => {
      const { bookingId } = req.params
      res.render(`pages/liteCategoriesConfirmed`, { bookingId })
    })
  )

  router.get(
    '/approve/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const [details, assessmentData, prisonListFromApi] = await Promise.all([
        offendersService.getBasicOffenderDetails(res.locals, bookingId),
        formService.getLiteCategorisation(bookingId, transactionalDbClient),
        offendersService.getAgencies(res.locals),
      ])
      const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
      const sameUser = res.locals.user.username === assessmentData.assessedBy

      const prisonList = [
        {},
        ...prisonListFromApi.map(p => ({ value: p.agencyId, text: sanitisePrisonName(p.description) })),
      ]
      res.render(`pages/liteApprove`, {
        bookingId,
        liteInProgress,
        sameUser,
        errors: [],
        assessmentData,
        prisonList,
        approvedDate: moment().format('DD/MM/YYYY'),
        supervisorCategory: assessmentData.category,
        nextReviewDate: assessmentData.displayNextReviewDate,
        data: { details },
      })
    })
  )

  router.post(
    '/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const bookingIdInt = parseInt(bookingId, 10)
      const { category, authority, nextReviewDate, placement, comment } = req.body
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const details = await offendersService.getBasicOffenderDetails(res.locals, bookingIdInt)

      const tomorrow = moment()
        .add(1, 'd')
        .format('MM/DD/YYYY')

      const fieldOptions = {
        nextReviewDate: joi
          .date()
          .format('D/M/YYYY')
          .min(tomorrow)
          .required(),
      }

      const joiErrors = joi.validate(req.body, fieldOptions, { stripUnknown: true, abortEarly: false })
      const errors = validation.mapJoiErrors(joiErrors, [
        {
          nextReviewDate: {
            responseType: 'nextReviewDate',
            validationMessage: 'Enter a valid date that is after today',
          },
        },
      ])

      if (errors.length) {
        const prisonListFromApi = await offendersService.getAgencies(res.locals)
        const prisonList = [
          { value: '' },
          ...prisonListFromApi.map(p => ({
            value: p.agencyId,
            text: sanitisePrisonName(p.description),
            selected: placement === p.agencyId,
          })),
        ]
        res.render(`pages/liteCategories`, {
          bookingId,
          errors,
          prisonList,
          category,
          authority,
          nextReviewDate,
          placement,
          comment,
          data: { details },
        })
      } else {
        await offendersService.createLiteCategorisation({
          context: res.locals,
          bookingId: bookingIdInt,
          category,
          authority,
          nextReviewDate,
          placement,
          comment,
          offenderNo: details.offenderNo,
          prisonId: details.agencyId,
          transactionalClient: transactionalDbClient,
        })
        res.redirect(`/liteCategories/confirmed/${bookingId}`)
      }
    })
  )

  router.post(
    '/approve/:bookingId',
    asyncMiddleware(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const bookingIdInt = parseInt(bookingId, 10)
      const {
        approvedDate,
        supervisorCategory,
        approvedCategoryComment,
        approvedCommittee,
        nextReviewDate,
        approvedPlacement,
        approvedPlacementComment,
        approvedComment,
      } = req.body
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const [details, assessmentData] = await Promise.all([
        offendersService.getBasicOffenderDetails(res.locals, bookingIdInt),
        formService.getLiteCategorisation(bookingId, transactionalDbClient),
      ])

      const tomorrow = moment()
        .add(1, 'd')
        .format('MM/DD/YYYY')
      const today = moment().format('MM/DD/YYYY')

      const fieldOptions = {
        nextReviewDate: joi
          .date()
          .format('D/M/YYYY')
          .min(tomorrow)
          .required(),
        approvedDate: joi
          .date()
          .format('D/M/YYYY')
          .max(today)
          .required(),
      }

      const joiErrors = joi.validate(req.body, fieldOptions, { stripUnknown: true, abortEarly: false })
      const errors = validation.mapJoiErrors(joiErrors, [
        {
          approvedDate: {
            responseType: 'approvedDate',
            validationMessage: 'Enter a valid date that is today or earlier',
          },
        },
        {
          nextReviewDate: {
            responseType: 'nextReviewDate',
            validationMessage: 'Enter a valid date that is after today',
          },
        },
      ])

      if (errors.length) {
        const prisonListFromApi = await offendersService.getAgencies(res.locals)
        const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate

        const prisonList = [
          { value: '' },
          ...prisonListFromApi.map(p => ({
            value: p.agencyId,
            text: sanitisePrisonName(p.description),
            selected: approvedPlacement === p.agencyId,
          })),
        ]
        res.render(`pages/liteApprove`, {
          bookingId,
          errors,
          liteInProgress,
          assessmentData,
          prisonList,
          approvedDate,
          supervisorCategory,
          approvedCategoryComment,
          approvedCommittee,
          nextReviewDate,
          approvedPlacement,
          approvedPlacementComment,
          approvedComment,
          data: { details },
        })
      } else {
        await offendersService.approveLiteCategorisation({
          context: res.locals,
          bookingId: bookingIdInt,
          sequence: assessmentData.sequence,
          approvedDate,
          supervisorCategory,
          approvedCategoryComment,
          approvedCommittee,
          nextReviewDate,
          approvedPlacement,
          approvedPlacementComment,
          approvedComment,
          transactionalClient: transactionalDbClient,
        })
        res.redirect(`/liteCategories/confirmed/${bookingId}`)
      }
    })
  )

  return router
}
