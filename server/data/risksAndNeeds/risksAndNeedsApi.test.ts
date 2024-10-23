// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock'
import * as redis from 'redis'
import config from '../../config'
import clientBuilder from './risksAndNeedsApi'
import { makeTestUser } from '../user.test-factory'

import { makeTestRiskSummaryDto } from './riskSummary.dto.test-factory'
import { RiskSummaryDto } from './riskSummary.dto'

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnThis(),
  connect: jest.fn().mockResolvedValue('connected'),
  on: jest.fn(),
  v4: {
    get: jest.fn().mockResolvedValue(true),
    set: jest.fn().mockImplementation((_key, _value, _options) => Promise.resolve(true)),
  },
  get: jest.fn().mockImplementation((key, callback) => {
    callback(null, 'redis-token')
    return true
  }),
  set: jest.fn().mockImplementation((key, value, command, ttl, callback) => {
    callback(null, 'redis-token')
    return true
  }),
}))

interface MockRedis {
  connect: jest.Mock
  on: jest.Mock
  v4: {
    get: jest.Mock
    set: jest.Mock
  }
}

const mockRedis = redis as unknown as MockRedis

function givenRedisResponse(storedToken: RiskSummaryDto) {
  mockRedis.v4.get.mockImplementation(_key => storedToken)
}

describe('risksAndNeedsApi Client', () => {
  let fakeApi
  let client

  beforeEach(() => {
    fakeApi = nock(config.apis.risksAndNeeds.url)
    client = clientBuilder(makeTestUser({ username: 'username' }))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getRisksSummary', () => {
    it('should return data from redis', async () => {
      const testResponse = makeTestRiskSummaryDto()
      givenRedisResponse(testResponse)
      fakeApi.get('/risks/crn/AN1234/summary').reply(200, testResponse)

      const output = await client.getRisksSummary('AN1234')
      return expect(output).toEqual(testResponse)
    })

    it('should return data from api', async () => {
      const testResponse = makeTestRiskSummaryDto()
      givenRedisResponse(null)
      fakeApi.get('/risks/crn/AN1235/summary').reply(200, testResponse)

      const output = await client.getRisksSummary('AN1235')
      return expect(output).toEqual(testResponse)
    })

    it('should handle a 404', async () => {
      givenRedisResponse(null)
      fakeApi.get('/risks/crn/AN1236/summary').reply(404, {})

      const output = await client.getRisksSummary('AN1236')
      return expect(output).toEqual({})
    })
  })
})
