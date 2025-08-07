const moment = require('moment')
const {
  filterJsonObjectForLogging,
  formatLength,
  calculateNextReviewDate,
  getLongDateFormat,
  getLongDateFormatIso,
  getVerboseDateFormat,
  isFemalePrisonId,
  setFemaleCaseLoads,
  catMappings,
  catLabel,
  isOpenCategory,
  choosingHigherCategory,
  properCase,
  isBlank,
  properCaseName,
  getNamesFromString,
  dateConverter,
  dateConverterToISO,
  formatDateForValidation,
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

describe('calculateNextReviewDate', () => {
  const SIX_MONTHS_AHEAD = moment().add(6, 'months')
  const TWELVE_MONTHS_AHEAD = moment().add(1, 'years')
  test.each`
    nextDateChoice | expectedValue
    ${'6'}         | ${SIX_MONTHS_AHEAD.format('D/M/YYYY')}
    ${'12'}        | ${TWELVE_MONTHS_AHEAD.format('D/M/YYYY')}
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

describe('getLongDateFormatIso', () => {
  test.each`
    nextDateChoice           | expectedValue
    ${undefined}             | ${''}
    ${''}                    | ${''}
    ${'2025-04-23'}          | ${'Wednesday 23 April 2025'}
    ${'1974-01-21'}          | ${'Monday 21 January 1974'}
    ${new Date(2020, 0, 15)} | ${'Wednesday 15 January 2020'}
  `('returns "$expectedValue" for "$date", "$nextDateChoice"', async ({ nextDateChoice, expectedValue }) => {
    const actualDate = getLongDateFormatIso(nextDateChoice)
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

describe('properCase', () => {
  it('returns a string in proper case', () => {
    expect(properCase('hello')).toBe('Hello')
    expect(properCase('hELLO')).toBe('Hello')
    expect(properCase('')).toBe('')
  })

  it('returns the original input if it is not a string or has a length of zero', () => {
    expect(properCase(null)).toBe(null)
    expect(properCase(undefined)).toBe(undefined)
    expect(properCase([])).toEqual([])
    expect(properCase({})).toEqual({})
  })
})

describe('isBlank', () => {
  it('returns true if a string is blank', () => {
    expect(isBlank('')).toBe(true)
    expect(isBlank('   ')).toBe(true)
    expect(isBlank('\n')).toBe(true)
  })

  it('returns false if a string is not blank', () => {
    expect(isBlank('hello')).toBe(false)
    expect(isBlank('  hello  ')).toBe(false)
    expect(isBlank('hello\nworld')).toBe(false)
  })
})

describe('properCaseName', () => {
  it('returns a string in proper case', () => {
    expect(properCaseName('double-barrel')).toBe('Double-Barrel')
    expect(properCaseName('DOUBLE-BARREL')).toBe('Double-Barrel')
    expect(properCaseName('LONG-double-bArrEl')).toBe('Long-Double-Barrel')
    expect(properCaseName('single')).toBe('Single')
    expect(properCaseName('')).toBe('')
  })

  it('returns the original input if it is blank', () => {
    expect(properCaseName(null)).toBe('')
    expect(properCaseName(undefined)).toBe('')
    expect(properCaseName('   ')).toBe('')
  })
})

describe('getNamesFromString', () => {
  it('returns a string with proper case names in reverse order', () => {
    expect(getNamesFromString('doe, john')).toBe('John Doe')
    expect(getNamesFromString('SMITH, JANE, doe, john')).toBe('John Doe Jane Smith')
    expect(getNamesFromString('SARAH')).toBe('Sarah')
  })

  describe('potentially unexpected behaviour', () => {
    it('does not always return a string', () => {
      expect(getNamesFromString(null)).toBe(undefined)
      expect(getNamesFromString(undefined)).toBe(undefined)
    })

    it('errors when given other types', () => {
      ;[123, [], {}].forEach(input => {
        expect(() => getNamesFromString(input)).toThrow(TypeError)
      })
    })

    it('returns the full string if the string did not contain a comma', () => {
      expect(getNamesFromString('doe john')).toBe('Doe john')
    })

    it('does not trim the names', () => {
      expect(getNamesFromString('doe , john')).toBe('John Doe ')
      expect(getNamesFromString('SMITH   ,  JANE , doe,   john')).toBe('  john Doe  jane  Smith   ')
      expect(getNamesFromString('   SARAH  ')).toBe('   sarah  ')
    })
  })
})

describe('dateConverter', () => {
  it('returns a formatted date when given a valid input', () => {
    expect(dateConverter('2022-01-01')).toBe('01/01/2022')
    expect(dateConverter('2022/01/01')).toBe('01/01/2022')
  })

  describe('potentially unexpected behaviour', () => {
    it('returns a non string type when given null or undefined', () => {
      expect(dateConverter(null)).toBe(null)
      expect(dateConverter(undefined)).toBe(undefined)
    })

    it("returns the literal string 'Invalid date' when given an invalid date", () => {
      expect(dateConverter('2022-13-01')).toBe('Invalid date')
    })

    it('returns an unexpected date when given a valid date in the wrong format', () => {
      expect(dateConverter('01/01/2022')).toBe('20/01/2001')
    })
  })
})

describe('dateConverterToISO', () => {
  it('returns a formatted date when given a valid input', () => {
    expect(dateConverterToISO('01/01/2022')).toBe('2022-01-01')
    expect(dateConverterToISO('01-01-2022')).toBe('2022-01-01')
  })

  describe('potentially unexpected behaviour', () => {
    it('returns a non string type when given null or undefined', () => {
      expect(dateConverterToISO(null)).toBe(null)
      expect(dateConverterToISO(undefined)).toBe(undefined)
    })

    it("returns the literal string 'Invalid date' when given a string in the wrong date format", () => {
      expect(dateConverterToISO('2022-01-01')).toBe('Invalid date')
    })

    it("returns the literal string 'Invalid date' when given an invalid date", () => {
      expect(dateConverterToISO('01/13/2022')).toBe('Invalid date')
    })
  })
})

describe('formatDateForValidation', () => {
  it('should format date correctly without leading zeros', () => {
    const input = { day: '7', month: '3', year: '2026' }
    expect(formatDateForValidation(input)).toBe('7/3/2026')
  })

  it('should format date correctly with leading zeros', () => {
    const input = { day: '07', month: '03', year: '2026' }
    expect(formatDateForValidation(input)).toBe('07/03/2026')
  })

  it('should return an empty string when day is missing', () => {
    const input = { day: '', month: '3', year: '2026' }
    expect(formatDateForValidation(input)).toBe(undefined)
  })

  test('should return an empty string when month is missing', () => {
    const input = { day: '7', month: '', year: '2026' }
    expect(formatDateForValidation(input)).toBe(undefined)
  })

  test('should return an empty string when year is missing', () => {
    const input = { day: '7', month: '3', year: '' }
    expect(formatDateForValidation(input)).toBe(undefined)
  })

  test('should return an empty string when the day, month and year are missing', () => {
    const input = { day: '', month: '3', year: '' }
    expect(formatDateForValidation(input)).toBe(undefined)
  })
})
