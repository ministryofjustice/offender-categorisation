const serviceCreator = require('../../server/services/statsService')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const prisonId = 'LEI'

const statsClient = {
  getRecatFromTo: jest.fn(),
  getSecurityReferrals: jest.fn(),
}

let service

beforeEach(() => {
  service = serviceCreator(statsClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getRecatFromTo', () => {
  test('should get table data', async () => {
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
