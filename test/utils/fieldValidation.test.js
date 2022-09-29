const moment = require('moment/moment')
const fieldValidation = require('../../server/utils/fieldValidation')
const pageConfig = require('../../server/config/nextReviewDate')

const overThreeYearsDate = moment().add(3, 'years').add(1, 'days').format('DD/MM/YYYY')
const validFutureDate = moment().add(12, 'months').format('DD/MM/YYYY')
const overOneYearsDate = moment().add(12, 'months').add(1, 'days').format('DD/MM/YYYY')
const todaysDate = moment().format('DD/MM/YYYY')
const pastDate = moment().subtract(1, 'days').format('DD/MM/YYYY')
const invalidDate = '78/13/3043'

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
  it('Validation should return the correct error message for indeterminate past day', () => {
    const formResponse = { indeterminate: 'true', date: pastDate }
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
  it('Validation should return the correct error message for determinate past day', () => {
    const formResponse = { indeterminate: 'false', date: pastDate }
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

// TODO add tests to cover legacy functionality in fieldValidation.js
