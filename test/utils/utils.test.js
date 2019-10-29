const moment = require('moment')
const {
  filterJsonObjectForLogging,
  formatLength,
  calculateNextReviewDate,
  getLongDateFormat,
} = require('../../server/utils/utils')

describe('filterJsonObjectForLogging', () => {
  it('it removes the _csrf property from a json object', () => {
    const data = { _csrf: '123456', another1: 'bla', another2: 'bla' }
    const result = filterJsonObjectForLogging(data)

    expect(result).toEqual({ another1: 'bla', another2: 'bla' })
  })
})

describe('formatLength formatting sentence length correctly', () => {
  test.each`
    apiData                                       | expectedContent
    ${{ years: 2, months: 4 }}                    | ${'2 years, 4 months'}
    ${{ months: 2, weeks: 4 }}                    | ${'2 months, 4 weeks'}
    ${{ days: 4 }}                                | ${'4 days'}
    ${{ years: 1, months: 1 }}                    | ${'1 year, 1 month'}
    ${{ weeks: 1 }}                               | ${'1 week'}
    ${{ weeks: 2, days: 4, years: null }}         | ${'2 weeks, 4 days'}
    ${{ years: 5, months: 6, weeks: 7, days: 1 }} | ${'5 years, 6 months, 7 weeks, 1 day'}
    ${{ years: 5, lifeSentence: true }}           | ${'Life'}
  `('should render $expectedContent for $apiData', async ({ apiData, expectedContent }) => {
    const result = formatLength(apiData)
    expect(result).toEqual(expectedContent)
  })
})

describe('calculateDate', () => {
  const SIX_MONTHS_AHEAD = moment().add(6, 'months')
  const TWELVE_MONTHS_AHEAD = moment().add(1, 'years')
  test.each`
    nextDateChoice | expectedValue
    ${'6'}         | ${SIX_MONTHS_AHEAD.format('DD/MM/YYYY')}
    ${'12'}        | ${TWELVE_MONTHS_AHEAD.format('DD/MM/YYYY')}
    ${'other'}     | ${''}
    ${''}          | ${''}
  `('returns "$expectedValue" for "$date", "$nextDateChoice"', async ({ nextDateChoice, expectedValue }) => {
    const actualDate = calculateNextReviewDate(nextDateChoice)
    expect(actualDate).toEqual(expectedValue)
  })
})

describe('getLongDateFormat', () => {
  test.each`
    nextDateChoice  | expectedValue
    ${undefined}    | ${''}
    ${''}           | ${''}
    ${'23/04/2025'} | ${'Wednesday 23rd April 2025'}
    ${'21/1/1974'}  | ${'Monday 21st January 1974'}
  `('returns "$expectedValue" for "$date", "$nextDateChoice"', async ({ nextDateChoice, expectedValue }) => {
    const actualDate = getLongDateFormat(nextDateChoice)
    expect(actualDate).toEqual(expectedValue)
  })
})
