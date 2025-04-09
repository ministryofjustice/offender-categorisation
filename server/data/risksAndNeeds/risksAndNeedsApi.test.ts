// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock'
import { config } from '../../config'
import clientBuilder from './risksAndNeedsApi'
import { makeTestUser } from '../user.test-factory'

import { makeTestRiskSummaryDto } from './riskSummary.dto.test-factory'

const testResponseFromRedis = JSON.stringify(makeTestRiskSummaryDto())

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockImplementation((key, callback) => {
      switch (key) {
        case 'riskSummary_AN1234':
          callback(null, testResponseFromRedis)
          return true
        case 'riskSummary_AN1235':
        case 'riskSummary_AN1236':
          callback(null, null)
          return true
        default:
          callback(null, 'redis-token')
      }
      return true
    }),
    set: jest.fn().mockImplementation((key, value, command, ttl, callback) => {
      callback(null, 'redis-token')
      return true
    }),
  })),
}))

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
      const output = await client.getRisksSummary('AN1234')
      return expect(output).toEqual(JSON.parse(testResponseFromRedis))
    })

    it('should return data from api', async () => {
      const testResponse = makeTestRiskSummaryDto()
      fakeApi.get('/risks/crn/AN1235/summary').reply(200, testResponse)

      const output = await client.getRisksSummary('AN1235')
      return expect(output).toEqual(testResponse)
    })

    it('should handle a 404', async () => {
      fakeApi.get('/risks/crn/AN1236/summary').reply(404, {})

      const output = await client.getRisksSummary('AN1236')
      return expect(output).toEqual({})
    })
  })
})
