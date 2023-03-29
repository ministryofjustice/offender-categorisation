const moment = require('moment')
const {
  filterJsonObjectForLogging,
  formatLength,
  calculateNextReviewDate,
  getLongDateFormat,
  getVerboseDateFormat,
  isFemalePrisonId,
  setFemaleCaseLoads,
  catMappings,
  catLabel,
  isOpenCategory,
  choosingHigherCategory,
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
    nextDateChoice           | expectedValue
    ${undefined}             | ${''}
    ${''}                    | ${''}
    ${'23/04/2025'}          | ${'Wednesday 23 April 2025'}
    ${'21/1/1974'}           | ${'Monday 21 January 1974'}
    ${new Date(2020, 0, 15)} | ${'Wednesday 15 January 2020'}
  `('returns "$expectedValue" for "$date", "$nextDateChoice"', async ({ nextDateChoice, expectedValue }) => {
    const actualDate = getLongDateFormat(nextDateChoice)
    expect(actualDate).toEqual(expectedValue)
  })
})

describe('getVerboseDateFormat', () => {
  test.each`
    nextDateChoice           | expectedValue
    ${undefined}             | ${''}
    ${''}                    | ${''}
    ${'23/04/2025'}          | ${'23 April 2025'}
    ${'21/1/1974'}           | ${'21 January 1974'}
    ${new Date(2020, 0, 15)} | ${'15 January 2020'}
  `('returns "$expectedValue" for "$date", "$nextDateChoice"', async ({ nextDateChoice, expectedValue }) => {
    const actualDate = getVerboseDateFormat(nextDateChoice)
    expect(actualDate).toEqual(expectedValue)
  })
})

describe('setFemalePrisonId should return expected value', () => {
  test.each`
    prisonId     | expectedValue
    ${undefined} | ${false}
    ${null}      | ${false}
    ${''}        | ${false}
    ${'PFI'}     | ${true}
    ${'PFI1'}    | ${false}
    ${'PKI'}     | ${false}
  `('returns "$expectedValue" for "prisonId"', async ({ prisonId, expectedValue }) => {
    const result = isFemalePrisonId(prisonId)
    expect(result).toEqual(expectedValue)
  })
})

describe('setFemaleCaseLoads should return expected caseload object containing female flag', () => {
  test.each`
    prisonId     | expectedValue
    ${undefined} | ${false}
    ${null}      | ${false}
    ${''}        | ${false}
    ${'PFI'}     | ${true}
    ${'PFI1'}    | ${false}
    ${'PKI'}     | ${false}
  `('returns "$expectedValue" for "prisonId"', async ({ prisonId, expectedValue }) => {
    const result = setFemaleCaseLoads([{ caseLoadId: prisonId }])
    const expectedObject = [{ caseLoadId: prisonId, female: expectedValue }]
    expect(result).toEqual(expectedObject)
  })
})

describe('setFemaleCaseLoads called with multiple caseloads should return expected array', () => {
  const result = setFemaleCaseLoads([{ caseLoadId: 'PKI' }, { caseLoadId: 'PFI' }])
  const expectedObject = [
    { caseLoadId: 'PKI', female: false },
    { caseLoadId: 'PFI', female: true },
  ]
  expect(result).toEqual(expectedObject)
})

describe('catMappings called with different categories should return expected result', () => {
  expect(catMappings('D')).toEqual('Open')
  expect(catMappings('X')).toEqual('X')
  expect(catMappings('I')).toEqual('YOI closed')
})

describe('catLabel called with different categories should return expect result', () => {
  expect(catLabel('B')).toEqual('Category B')
  expect(catLabel('J')).toEqual('YOI open category')
  expect(catLabel('Q')).toEqual('Restricted category')
  expect(catLabel('SS')).toEqual('SS category')
})
describe('isOpenCategory should return expected value', () => {
  expect(isOpenCategory('D')).toEqual(true)
  expect(isOpenCategory('J')).toEqual(true)
  expect(isOpenCategory('T')).toEqual(true)
  expect(isOpenCategory('Anything else')).toEqual(false)
  expect(isOpenCategory(null)).toEqual(false)
  expect(isOpenCategory(undefined)).toEqual(false)
})
describe('choosingHigherCategory should return expected value for male category transitions', () => {
  expect(choosingHigherCategory('D', 'B')).toEqual(true)
  expect(choosingHigherCategory('B', 'D')).toEqual(false)
  expect(choosingHigherCategory('D', 'C')).toEqual(true)
  expect(choosingHigherCategory('C', 'D')).toEqual(false)
  expect(choosingHigherCategory('C', 'B')).toEqual(true)
  expect(choosingHigherCategory('B', 'C')).toEqual(false)
})
describe('choosingHigherCategory should return expected value for female category transitions', () => {
  expect(choosingHigherCategory('T', 'R')).toEqual(true)
  expect(choosingHigherCategory('R', 'T')).toEqual(false)
})
describe('choosingHigherCategory should return expected value for YOI category transitions', () => {
  expect(choosingHigherCategory('J', 'I')).toEqual(true)
  expect(choosingHigherCategory('I', 'J')).toEqual(false)
})
describe('choosingHigherCategory should return expected value for YOI into male category transitions', () => {
  expect(choosingHigherCategory('J', 'C')).toEqual(true)
  expect(choosingHigherCategory('C', 'J')).toEqual(false)
  expect(choosingHigherCategory('J', 'B')).toEqual(true)
  expect(choosingHigherCategory('B', 'J')).toEqual(false)
  expect(choosingHigherCategory('J', 'D')).toEqual(true)
  expect(choosingHigherCategory('D', 'J')).toEqual(false)
})
describe('choosingHigherCategory should return expected value for YOI into female category transitions', () => {
  expect(choosingHigherCategory('J', 'R')).toEqual(true)
  expect(choosingHigherCategory('R', 'J')).toEqual(false)
  expect(choosingHigherCategory('J', 'T')).toEqual(true)
  expect(choosingHigherCategory('T', 'J')).toEqual(false)
})
describe('choosingHigherCategory should return expected value for opne into YOI closed category transitions', () => {
  expect(choosingHigherCategory('T', 'I')).toEqual(true)
  expect(choosingHigherCategory('I', 'T')).toEqual(false)
  expect(choosingHigherCategory('D', 'I')).toEqual(true)
  expect(choosingHigherCategory('I', 'D')).toEqual(false)
})
