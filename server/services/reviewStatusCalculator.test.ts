import { parseISO } from 'date-fns'
import { isReviewOverdue } from './reviewStatusCalculator'

describe('isReviewOverdue', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns true if the date is before the current time', () => {
    jest.setSystemTime(parseISO('2022-01-02'))
    const dbDate = '2022-01-01'

    expect(isReviewOverdue(dbDate)).toBe(true)
  })

  it('returns false if the date is after the current time', () => {
    jest.setSystemTime(parseISO('2022-01-01'))
    const dbDate = '2022-01-02'

    expect(isReviewOverdue(dbDate)).toBe(false)
  })

  it('returns false if the date is the same as the current time', () => {
    jest.setSystemTime(parseISO('2022-01-01'))
    const dbDate = '2022-01-01'

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
