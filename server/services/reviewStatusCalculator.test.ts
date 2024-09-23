import moment from 'moment/moment'
import { isReviewOverdue } from './reviewStatusCalculator'

describe('isReviewOverdue', () => {
  it('returns true if the date is before the current time', () => {
    const dbDate = '2022-01-01'
    const now = moment('2022-01-02', 'YYYY-MM-DD')
    jest.spyOn(moment, 'now').mockImplementation(() => now.valueOf())

    expect(isReviewOverdue(dbDate)).toBe(true)
  })

  it('returns false if the date is after the current time', () => {
    const dbDate = '2022-01-02'
    const now = moment('2022-01-01', 'YYYY-MM-DD')
    jest.spyOn(moment, 'now').mockImplementation(() => now.valueOf())

    expect(isReviewOverdue(dbDate)).toBe(false)
  })

  it('returns false if the date is the same as the current time', () => {
    const dbDate = '2022-01-01'
    const now = moment('2022-01-01', 'YYYY-MM-DD')
    jest.spyOn(moment, 'now').mockImplementation(() => now.valueOf())

    expect(isReviewOverdue(dbDate)).toBe(false)
  })

  it('returns false if the input is null or undefined', () => {
    expect(isReviewOverdue(null)).toBe(false)
    expect(isReviewOverdue(undefined)).toBe(false)
  })

  it('returns false if the input is not a string in the format of "YYYY-MM-DD"', () => {
    expect(isReviewOverdue('2022-01-01T00:00:00')).toBe(false)
    expect(isReviewOverdue('January 1, 2022')).toBe(false)
    expect(isReviewOverdue('22-01-01')).toBe(false)
  })
})
