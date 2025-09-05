const express = require('express')
const moment = require('moment')
const flash = require('connect-flash')
const baseJoi = require('joi')
const dateExtend = require('@joi/date')
const {
  properCaseName,
  calculateNextReviewDate,
  sanitisePrisonName,
  removeLeadingZerosFromDate,
  dateConverterWithoutLeadingZeros,
  formatDateForValidation,
  isFemalePrisonId,
} = require('../utils/utils')
const { handleCsrf } = require('../utils/routes')
const asyncMiddlewareInDatabaseTransaction = require('../middleware/asyncMiddlewareInDatabaseTransaction')

const joi = baseJoi.extend(dateExtend)

/**
 * 'Lite' categorisation is simply a P-Nomis style workflow for any cats other than B/C/D/I/J.
 * This renders it unnecessary to go to P-Nomis for category assessments at all, hopefully!
 */

const getPrisonList = (prisonListFromApi, isWomensEstatePrisoner, current) => {
  const prisonList = []
  if (!current) {
    prisonList.push({
      value: '',
      text: 'Choose recommended placement',
      disabled: true,
      selected: true,
    })
  }
  prisonList.push(
    ...prisonListFromApi
      .filter(p => (isWomensEstatePrisoner ? isFemalePrisonId(p.agencyId) : !isFemalePrisonId(p.agencyId)))
      .map(p => ({
        value: p.agencyId,
        text: sanitisePrisonName(p.description),
        selected: current === p.agencyId,
      }))
      .sort((a, b) => (a.text < b.text ? -1 : 1)),
  )
  return prisonList
}
const getCommitteeList = current => {
  const committeeList = []
  if (!current) {
    committeeList.push({
      value: '',
      text: 'Choose authority',
      disabled: true,
      selected: true,
    })
  }
  committeeList.push(
    { value: 'OCA', text: 'OCA', selected: current === 'OCA' },
    { value: 'REVIEW', text: 'Review', selected: current === 'REVIEW' },
    { value: 'RECP', text: 'Reception', selected: current === 'RECP' },
    { value: 'SECUR', text: 'Security', selected: current === 'SECUR' },
    { value: 'GOV', text: 'Governor', selected: current === 'GOV' },
  )
  return committeeList
}

const getCatList = (isWomensEstatePrisoner, current) => {
  const categories = []
  if (!current) {
    categories.push({
      value: '',
      text: 'Choose category',
      disabled: true,
      selected: true,
    })
  }
  categories.push({ value: 'U', text: 'Unsentenced', selected: current === 'U' })
  if (!isWomensEstatePrisoner) {
    categories.push({ value: 'Z', text: 'Unclass', selected: current === 'Z' })
  }
  categories.push({ value: 'V', text: 'YOI Restricted', selected: current === 'V' })
  if (isWomensEstatePrisoner) {
    categories.push({ value: 'Q', text: 'Restricted', selected: current === 'Q' })
  } else {
    categories.push(
      { value: 'A', text: 'Cat A', selected: current === 'A' },
      { value: 'E', text: 'Cat A Ex', selected: current === 'E' },
      { value: 'H', text: 'Cat A Hi', selected: current === 'H' },
      { value: 'P', text: 'Prov A', selected: current === 'P' },
      { value: 'B', text: 'Downgrade A to B', selected: current === 'B' },
      { value: 'D', text: 'Indeterminate Cat D', selected: current === 'D' },
    )
  }
  return categories
}

const assessmentHasBeenApprovedInNomisManually = error => {
  return error.status === 400 && error.data.developerMessage.startsWith('400 No pending category assessment found')
}

module.exports = function Index({ formService, offendersService, userService, authenticationMiddleware }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())
  router.use(handleCsrf)

  router.get(
    '/approveList',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const offenders = await offendersService.getUnapprovedLite(res.locals, transactionalDbClient)
      res.render(`pages/supervisorLite`, { offenders })
    }),
  )

  router.get(
    '/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const [details, categorisationRecord, existingData, prisonListFromApi] = await Promise.all([
        offendersService.getOffenderDetails(res.locals, bookingId),
        formService.getCategorisationRecord(bookingId, transactionalDbClient),
        formService.getLiteCategorisation(bookingId, transactionalDbClient),
        offendersService.getAgencies(res.locals),
      ])
      const liteInProgress = existingData.bookingId && !existingData.approvedDate

      const isInWomensEstate = isFemalePrisonId(details.prisonId)
      const prisonList = getPrisonList(prisonListFromApi, isInWomensEstate)
      const committees = getCommitteeList()
      const cats = getCatList(isInWomensEstate)

      res.render(`pages/liteCategories`, {
        bookingId,
        errors: [],
        liteInProgress,
        cats,
        committees,
        prisonList,
        nextReviewDate: calculateNextReviewDate('6'),
        data: { details, status: categorisationRecord.status },
      })
    }),
  )

  router.get(
    '/confirmed/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const { bookingId } = req.params
      res.render(`pages/liteCategoriesConfirmed`, { bookingId })
    }),
  )

  router.get(
    '/approve/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const [details, rawAssessmentData, prisonListFromApi] = await Promise.all([
        offendersService.getOffenderDetails(res.locals, bookingId),
        formService.getLiteCategorisation(bookingId, transactionalDbClient),
        offendersService.getAgencies(res.locals),
      ])
      const isInWomensEstate = isFemalePrisonId(details.prisonId)
      const cats = getCatList(isInWomensEstate, rawAssessmentData.category)
      const category = cats.find(c => c.value === rawAssessmentData.category)
      const categoryDisplay = category ? category.text : rawAssessmentData.category

      const committees = getCommitteeList(rawAssessmentData.assessmentCommittee)
      const committee = committees.find(c => c.value === rawAssessmentData.assessmentCommittee)
      const assessmentCommitteeDisplay = committee ? committee.text : rawAssessmentData.assessmentCommittee

      const assessedBy = await userService.getUserByUserId(res.locals, rawAssessmentData.assessedBy)
      const assessedByDisplay = assessedBy
        ? `${properCaseName(assessedBy.firstName)} ${properCaseName(assessedBy.lastName)}`
        : rawAssessmentData.assessedBy

      const prisonList = getPrisonList(prisonListFromApi, isInWomensEstate, rawAssessmentData.placementPrisonId)
      const prison = prisonList.find(p => p.value === rawAssessmentData.placementPrisonId)
      const placementPrisonIdDisplay = prison ? prison.text : rawAssessmentData.placementPrisonId

      const liteInProgress = rawAssessmentData.bookingId && !rawAssessmentData.approvedDate
      const sameUser = res.locals.user.username === rawAssessmentData.assessedBy

      const assessmentData = {
        categoryDisplay,
        assessedByDisplay,
        assessmentCommitteeDisplay,
        placementPrisonIdDisplay,
        ...rawAssessmentData,
      }

      const today = moment()

      res.render(`pages/liteApprove`, {
        bookingId,
        liteInProgress,
        sameUser,
        errors: [],
        assessmentData,
        cats,
        committees,
        prisonList,
        approvedDate: {
          day: today.date().toString(),
          month: (today.month() + 1).toString(),
          year: today.year().toString(),
        },
        data: { details },
      })
    }),
  )

  router.post(
    '/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const bookingIdInt = parseInt(bookingId, 10)
      const { category, authority, placement, comment } = req.body
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }
      const originalDateInput = req.body.nextReviewDate
      req.body.nextReviewDate = formatDateForValidation(req.body.nextReviewDate)
      const details = await offendersService.getOffenderDetails(res.locals, bookingIdInt)
      const isInWomensEstate = isFemalePrisonId(details.prisonId)
      const prisonListFromApi = await offendersService.getAgencies(res.locals)
      const { nextReviewDate } = req.body

      const tomorrow = moment().add(1, 'd').format('MM/DD/YYYY')

      const fieldOptions = {
        category: joi
          .string()
          .valid(...getCatList(isInWomensEstate).map(c => c.value))
          .required()
          .messages({ 'any.required': 'Select a category' }),
        authority: joi
          .string()
          .valid(...getCommitteeList().map(c => c.value))
          .required()
          .messages({ 'any.required': 'Select an authority' }),
        nextReviewDate: joi.date().format('D/M/YYYY').min(tomorrow).required().messages({
          'any.required': 'Enter a valid date that is after today',
          'date.format': 'Enter a valid date that is after today',
          'date.min': 'Enter a valid date that is after today',
        }),
        placement: joi
          .string()
          .valid(...getPrisonList(prisonListFromApi, isInWomensEstate).map(p => p.value))
          .required()
          .messages({ 'any.required': 'Select a recommended placement' }),
      }

      const schema = joi.object(fieldOptions)

      if (nextReviewDate) {
        req.body.nextReviewDate = removeLeadingZerosFromDate(nextReviewDate)
      }

      const formValidation = schema.validate(req.body, { stripUnknown: true, abortEarly: false })

      if (formValidation.error) {
        const prisonList = getPrisonList(prisonListFromApi, isInWomensEstate, placement)
        const cats = getCatList(isInWomensEstate, category)
        const committees = getCommitteeList(authority)

        res.render(`pages/liteCategories`, {
          bookingId,
          errors: formValidation.error.details.map(error => ({
            text: error.message,
            href: `#${error.context.label}`,
          })),
          cats,
          committees,
          prisonList,
          category,
          authority,
          nextReviewDate: originalDateInput,
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
    }),
  )

  router.post(
    '/approve/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res, transactionalDbClient) => {
      const { bookingId } = req.params
      const originalApprovedDate = req.body.approvedDate
      req.body.approvedDate = formatDateForValidation(req.body.approvedDate)
      const originalApprovedNextReviewDate = req.body.approvedNextReviewDate
      req.body.approvedNextReviewDate = formatDateForValidation(req.body.approvedNextReviewDate)
      const bookingIdInt = parseInt(bookingId, 10)
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      const assessmentData = await formService.getLiteCategorisation(bookingId, transactionalDbClient)
      const [details, prisonListFromApi] = await Promise.all([
        offendersService.getOffenderDetails(res.locals, bookingIdInt),
        offendersService.getAgencies(res.locals),
      ])
      const isInWomensEstate = isFemalePrisonId(details.prisonId)
      const tomorrow = moment().add(1, 'd').format('M/D/YYYY')
      const today = moment().format('M/D/YYYY')

      const fieldOptions = {
        approvedDate: joi.date().format('D/M/YYYY').max(today).required().messages({
          'any.required': 'Enter a valid date that is today or earlier',
          'date.format': 'Enter a valid date that is today or earlier',
          'date.max': 'Enter a valid date that is today or earlier',
        }),
        supervisorCategory: joi
          .string()
          .valid(...getCatList(isInWomensEstate).map(c => c.value))
          .required()
          .messages({ 'any.required': 'Select a category' }),
        approvedCommittee: joi
          .string()
          .valid(...getCommitteeList().map(c => c.value))
          .required()
          .messages({ 'any.required': 'Select an authority' }),
        approvedNextReviewDate: joi.date().format('D/M/YYYY').min(tomorrow).required().messages({
          'any.required': 'Enter a valid date that is after today',
          'date.format': 'Enter a valid date that is after today',
          'date.min': 'Enter a valid date that is after today',
        }),
        approvedPlacement: joi
          .string()
          .valid(...getPrisonList(prisonListFromApi, isInWomensEstate).map(p => p.value))
          .required()
          .messages({ 'any.required': 'Select a recommended placement' }),
        approvedComment: joi.string().allow('').optional(),
      }

      if (req.body.approvedNextReviewDate) {
        req.body.approvedNextReviewDate = removeLeadingZerosFromDate(req.body.approvedNextReviewDate)
      }
      if (req.body.approvedDate) {
        req.body.approvedDate = removeLeadingZerosFromDate(req.body.approvedDate)
      }

      const schema = joi.object(fieldOptions)
      const formValidation = schema.validate(req.body, { stripUnknown: true, abortEarly: false })

      if (formValidation.error) {
        const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
        const cats = getCatList(isInWomensEstate, formValidation.value.supervisorCategory)
        const committees = getCommitteeList(formValidation.value.approvedCommittee)
        const prisonList = getPrisonList(prisonListFromApi, isInWomensEstate, formValidation.value.approvedPlacement)

        const category = cats.find(c => c.value === assessmentData.category)
        const categoryDisplay = category ? category.text : assessmentData.category

        const committee = committees.find(c => c.value === assessmentData.assessmentCommittee)
        const assessmentCommitteeDisplay = committee ? committee.text : assessmentData.assessmentCommittee

        const assessedBy = await userService.getUserByUserId(res.locals, assessmentData.assessedBy)
        const assessedByDisplay = assessedBy
          ? `${properCaseName(assessedBy.firstName)} ${properCaseName(assessedBy.lastName)}`
          : assessmentData.assessedBy

        const prison = prisonList.find(p => p.value === assessmentData.placementPrisonId)
        const placementPrisonIdDisplay = prison ? prison.text : assessmentData.placementPrisonId

        const assessmentDataForDisplay = {
          categoryDisplay,
          assessedByDisplay,
          assessmentCommitteeDisplay,
          placementPrisonIdDisplay,
          ...assessmentData,
        }

        res.render(`pages/liteApprove`, {
          bookingId,
          errors: formValidation.error.details.map(error => ({
            text: error.message,
            href: `#${error.context.label}`,
          })),
          liteInProgress,
          assessmentData: assessmentDataForDisplay,
          cats,
          committees,
          prisonList,
          approvedDate: originalApprovedDate,
          approvedNextReviewDate: originalApprovedNextReviewDate,
          approvedComment: formValidation.value.approvedComment,
          data: { details },
        })
      } else {
        try {
          await offendersService.approveLiteCategorisation({
            context: res.locals,
            bookingId: bookingIdInt,
            sequence: assessmentData.sequence,
            approvedDate: dateConverterWithoutLeadingZeros(formValidation.value.approvedDate),
            supervisorCategory: formValidation.value.supervisorCategory,
            approvedCommittee: formValidation.value.approvedCommittee,
            nextReviewDate: dateConverterWithoutLeadingZeros(formValidation.value.approvedNextReviewDate),
            approvedPlacement: formValidation.value.approvedPlacement,
            approvedComment: formValidation.value.approvedComment,
            transactionalClient: transactionalDbClient,
          })
          res.redirect(`/liteCategories/confirmed/${bookingId}`)
        } catch (error) {
          if (assessmentHasBeenApprovedInNomisManually(error)) {
            await formService.deleteLiteCategorisation(bookingId, assessmentData.sequence, transactionalDbClient)
            res.redirect(`/liteCategories/alreadyApproved/${bookingId}`)
          } else {
            throw error
          }
        }
      }
    }),
  )

  router.get(
    '/alreadyApproved/:bookingId',
    asyncMiddlewareInDatabaseTransaction(async (req, res) => {
      const { bookingId } = req.params
      const user = await userService.getUser(res.locals)
      res.locals.user = { ...user, ...res.locals.user }

      res.render(`pages/liteAlreadyApproved`, { context: res.locals, bookingId })
    }),
  )

  return router
}
