// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock'
import { config } from '../../config'
import { makeTestUser } from '../user.test-factory'
import { adjudicationsApiClientBuilder } from './adjudicationsApiClient'
import { makeTestAdjudicationsDto } from './adjudications.dto.test-factory'

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockImplementation((key, callback) => {
      callback(null, 'redis-token')
      return true
    }),
    set: jest.fn().mockImplementation((key, value, command, ttl, callback) => {
      callback(null, 'redis-token')
      return true
    }),
  })),
}))

describe('adjudicationsApiClientBuilder', () => {
  let fakeApi
  let client

  beforeEach(() => {
    fakeApi = nock(config.apis.adjudicationsApi.url)
    client = adjudicationsApiClientBuilder(makeTestUser({ username: 'username' }))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getAdjudications', () => {
    it('should return data from adjudications api', async () => {
      const testResponse = makeTestAdjudicationsDto()
      fakeApi
        .get(`/adjudications/by-booking-id/123`)
        .query({ adjudicationCutoffDate: '2025-01-01' })
        .reply(200, testResponse)

      const output = await client.getAdjudications(123, '2025-01-01')
      return expect(output).toEqual(testResponse)
    })
  })
})
