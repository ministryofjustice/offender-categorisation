const { filterJsonObjectForLogging, formatLength } = require('../../server/utils/utils')

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
