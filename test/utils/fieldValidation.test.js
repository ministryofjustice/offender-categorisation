const moment = require('moment/moment')
const fieldValidation = require('../../server/utils/fieldValidation')
const pageConfig = require('../../server/config/nextReviewDate')

const overThreeYearsDate = moment().add(3, 'years').add(1, 'days').format('D/M/YYYY')
const validFutureDate = moment().add(12, 'months').format('D/M/YYYY')
const overOneYearsDate = moment().add(12, 'months').add(1, 'days').format('D/M/YYYY')
const todaysDate = moment().format('D/M/YYYY')
const todaysDateAlternativeFormat = moment().format('DD/MM/YYYY')
const pastDate = moment().subtract(1, 'days').format('D/M/YYYY')
const pastDateAlternativeFormat = moment().subtract(1, 'month').startOf('month').format('DD/MM/YYYY')
const invalidDate = '78/13/3043'
const tomorrow = moment().add(1, 'days').format('D/M/YYYY')

describe('Validating next review date for indeterminate', () => {
  it('Validation should return the correct error message for indeterminate over 3 years', () => {
    const formResponse = { indeterminate: 'true', date: overThreeYearsDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The date that they are reviewed by must be within 3 years' },
    ])
  })
  it('Validation should pass for valid future date for indeterminate', () => {
    const formResponse = { indeterminate: 'true', date: validFutureDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should pass for indeterminate over 1 year', () => {
    const formResponse = { indeterminate: 'true', date: overOneYearsDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should pass for indeterminate with today', () => {
    const formResponse = { indeterminate: 'true', date: todaysDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should pass for indeterminate with today using alternative format', () => {
    const formResponse = { indeterminate: 'true', date: todaysDateAlternativeFormat }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should return the correct error message for indeterminate past day', () => {
    const formResponse = { indeterminate: 'true', date: pastDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be today or in the future' },
    ])
  })
  it('Validation should return the correct error message for indeterminate past day when the date has leading 0s', () => {
    const formResponse = { indeterminate: 'true', date: pastDateAlternativeFormat }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be today or in the future' },
    ])
  })
  it('Validation should return the correct error message for indeterminate with invalid date', () => {
    const formResponse = { indeterminate: 'true', date: invalidDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be a real date' },
    ])
  })
})

describe('Validating next review date for determinate', () => {
  it('Validation should return the correct error message for determinate over 3 years', () => {
    const formResponse = { indeterminate: 'false', date: overThreeYearsDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The date that they are reviewed must be within the next 12 months' },
    ])
  })
  it('Validation should pass for valid future date for determinate', () => {
    const formResponse = { indeterminate: 'false', date: validFutureDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should return the correct error message for determinate over 1 year', () => {
    const formResponse = { indeterminate: 'false', date: overOneYearsDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The date that they are reviewed must be within the next 12 months' },
    ])
  })
  it('Validation should pass for determinate with today', () => {
    const formResponse = { indeterminate: 'false', date: todaysDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should pass for determinate with today using alternative format', () => {
    const formResponse = { indeterminate: 'false', date: todaysDateAlternativeFormat }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([])
  })
  it('Validation should return the correct error message for determinate past day', () => {
    const formResponse = { indeterminate: 'false', date: pastDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be today or in the future' },
    ])
  })
  it('Validation should return the correct error message for determinate past day', () => {
    const formResponse = { indeterminate: 'false', date: pastDateAlternativeFormat }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be today or in the future' },
    ])
  })
  it('Validation should return the correct error message for determinate with invalid date', () => {
    const formResponse = { indeterminate: 'false', date: invalidDate }
    expect(fieldValidation.validate(formResponse, pageConfig.nextReviewDate)).toEqual([
      { href: '#date', text: 'The review date must be a real date' },
    ])
  })
})

describe('Validating oasys review date for today and past date', () => {
  const dateConfig = {
    nextPath: {
      path: '/tasklistRecat/',
    },
    fields: [
      {
        date: {
          responseType: 'todayOrPastDate',
          validationMessage: '',
          errorMessagePrefix: 'OASys review date',
        },
      },
    ],
    validate: true,
  }
  it('Validation should return the correct error message for date in future', () => {
    const formResponse = { date: tomorrow }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([
      { href: '#date', text: 'OASys review date must be today or in the past' },
    ])
  })
  it('Validation should pass for valid todays date', () => {
    const formResponse = { date: todaysDate }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([])
  })
  it('Validation should pass for valid todays date using alternative format', () => {
    const formResponse = { date: todaysDateAlternativeFormat }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([])
  })
  it('Validation should pass for valid past date', () => {
    const formResponse = { date: pastDate }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([])
  })
  it('Validation should return the correct error message for invalid date', () => {
    const formResponse = { date: invalidDate }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([
      { href: '#date', text: 'OASys review date must be a real date' },
    ])
  })
  it('Validation should return the correct error message for blank date', () => {
    const formResponse = { date: '' }
    expect(fieldValidation.validate(formResponse, dateConfig)).toEqual([
      { href: '#date', text: 'OASys review date must be a real date' },
    ])
  })
})
// TODO add tests to cover legacy functionality in fieldValidation.js
