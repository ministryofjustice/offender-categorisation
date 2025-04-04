const serviceCreator = require('../../server/services/statsService')
const CatType = require('../../server/utils/catTypeEnum')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const prisonId = 'LEI'

const statsClient = {
  getRecatFromTo: jest.fn(),
  getSecurityReferrals: jest.fn(),
  getOnTime: jest.fn(),
  getInitialCategoryOutcomes: jest.fn(),
  getTprsTotals: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator(statsClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getRecatFromTo', () => {
  test('should get table data for male estates', async () => {
    statsClient.getRecatFromTo.mockReturnValue({
      rows: [
        {
          count: 6,
          previous: 'B',
          current: 'C',
        },
        {
          count: 7,
          previous: 'C',
          current: 'C',
        },
        {
          count: 5,
          previous: 'I',
          current: 'I',
        },
        {
          count: 2,
          previous: 'I',
          current: 'J',
        },
        {
          count: 0,
          previous: null,
          current: 'J',
        },
        {
          count: 0,
        },
      ],
    })
    const table = await service.getRecatFromTo('dummy', 'dummy', prisonId, mockTransactionalClient)
    expect(table).toEqual([
      [undefined, 6, undefined, undefined, undefined, 6],
      [undefined, 7, undefined, undefined, undefined, 7],
      [undefined, undefined, undefined, undefined, undefined, 0],
      [undefined, undefined, undefined, 5, 2, 7],
      [undefined, undefined, undefined, undefined, undefined, 0],
      [0, 13, 0, 5, 2, 20],
    ])
  })

  test('should get table data for female estates', async () => {
    statsClient.getRecatFromTo.mockReturnValue({
      rows: [
        {
          count: 6,
          previous: 'T',
          current: 'R',
        },
        {
          count: 7,
          previous: 'R',
          current: 'R',
        },
        {
          count: 8,
          previous: 'R',
          current: 'T',
        },
        {
          count: 5,
          previous: 'I',
          current: 'I',
        },
        {
          count: 2,
          previous: 'I',
          current: 'J',
        },
        {
          count: 0,
          previous: null,
          current: 'J',
        },
        {
          count: 0,
        },
      ],
    })
    const table = await service.getRecatFromTo('dummy', 'dummy', 'PFI', mockTransactionalClient, true)
    /* eslint-disable prettier/prettier */
    expect(table).toEqual([
      [undefined,         6, undefined, undefined,  6],
      [8,                 7, undefined, undefined, 15],
      [undefined, undefined,         5,         2,  7],
      [undefined, undefined, undefined, undefined,  0],
      [        8,        13,         5,         2, 28],
    ])
    /* eslint-enable prettier/prettier */
  })
})

describe('getSecurityReferrals', () => {
  test('should get security referrals', async () => {
    statsClient.getSecurityReferrals.mockReturnValue({
      rows: [
        {
          count: 1,
          security: 'manual',
        },
        {
          count: 1,
          security: 'auto',
        },
        {
          count: 1,
          security: 'flagged',
        },
      ],
    })
    const actual = await service.getSecurityReferrals('INITIAL', 'dummy', 'dummy', prisonId, mockTransactionalClient)
    expect(actual).toEqual({
      manual: 1,
      auto: 1,
      flagged: 1,
      total: 3,
    })
  })
})

describe('getOnTime', () => {
  test('should get completion details', async () => {
    statsClient.getOnTime.mockReturnValue({
      rows: [
        {
          count: 1,
          onTime: true,
        },
        {
          count: 2,
          onTime: false,
        },
      ],
    })
    const actual = await service.getOnTime('INITIAL', 'dummy', 'dummy', prisonId, mockTransactionalClient)
    expect(actual).toEqual({
      onTime: 1,
      notOnTime: 2,
      total: 3,
    })
  })
})

describe('getInitialCategoryOutcomes', () => {
  test('should get row data for male estates', async () => {
    statsClient.getInitialCategoryOutcomes.mockReturnValue({
      rows: [
        {
          count: 1,
          initialCat: 'B',
          initialOverride: 'C',
          superOverride: null,
        },
        {
          count: 2,
          initialCat: 'C',
          initialOverride: null,
          superOverride: 'B',
        },
        {
          count: 1,
          initialCat: 'C',
          initialOverride: 'D',
          superOverride: 'C',
        },
        {
          count: 2,
          initialCat: 'I',
          initialOverride: null,
          superOverride: 'J',
        },
        {
          count: 1,
          initialCat: 'I',
          initialOverride: null,
          superOverride: null,
        },
      ],
    })
    const actual = await service.getInitialCategoryOutcomes('dummy', 'dummy', prisonId, mockTransactionalClient)
    expect(actual).toEqual([
      {
        count: 1,
        initialCat: 'B',
        initialOverride: 'C',
        superOverride: null,
      },
      {
        count: 2,
        initialCat: 'C',
        initialOverride: null,
        superOverride: 'B',
      },
      {
        count: 1,
        initialCat: 'C',
        initialOverride: 'D',
        superOverride: 'C',
      },
      {
        count: 2,
        initialCat: 'I',
        initialOverride: null,
        superOverride: 'J',
      },
      {
        count: 1,
        initialCat: 'I',
        initialOverride: null,
        superOverride: null,
      },
    ])
  })

  test('should get row data for female estates', async () => {
    statsClient.getInitialCategoryOutcomes.mockReturnValue({
      rows: [
        {
          count: 15,
          initialCat: 'R',
          superOverride: null,
        },
        {
          count: 4,
          initialCat: 'T',
          superOverride: null,
        },
        {
          count: 3,
          initialCat: 'T',
          superOverride: 'R',
        },
      ],
    })
    const actual = await service.getInitialCategoryOutcomes('dummy', 'dummy', prisonId, mockTransactionalClient)
    expect(actual).toEqual([
      {
        count: 15,
        initialCat: 'R',
        superOverride: null,
      },
      {
        count: 4,
        initialCat: 'T',
        superOverride: null,
      },
      {
        count: 3,
        initialCat: 'T',
        superOverride: 'R',
      },
    ])
  })
})

describe('getTprsTotals', () => {
  let startDate
  let endDate

  beforeEach(() => {
    startDate = 'dummyStartDate'
    endDate = 'dummyEndDate'

    statsClient.getTprsTotals.mockReturnValue({
      rows: [],
    })
  })

  test('initial categorisation calls the stats client with the expected arguments', async () => {
    await service.getTprsTotals(CatType.INITIAL.name, startDate, endDate, prisonId, mockTransactionalClient)

    expect(statsClient.getTprsTotals).toHaveBeenCalledTimes(1)
    expect(statsClient.getTprsTotals).toHaveBeenCalledWith(
      CatType.INITIAL.name,
      startDate,
      endDate,
      prisonId,
      mockTransactionalClient,
    )
  })

  test('recategorisation calls the stats client with the expected arguments', async () => {
    const anotherPrisonId = 'ANY'

    await service.getTprsTotals(CatType.RECAT.name, startDate, endDate, anotherPrisonId, mockTransactionalClient)

    expect(statsClient.getTprsTotals).toHaveBeenCalledTimes(1)
    expect(statsClient.getTprsTotals).toHaveBeenCalledWith(
      CatType.RECAT.name,
      startDate,
      endDate,
      anotherPrisonId,
      mockTransactionalClient,
    )
  })
})
