// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock'
import { config } from '../../config'
import { makeTestUser } from '../user.test-factory'
import { pathfinderApiClientBuilder } from './pathfinderApiClient'

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

describe('pathfinderApiClientBuilder', () => {
  let fakeApi
  let client

  beforeEach(() => {
    fakeApi = nock(config.apis.pathfinderApi.url)
    client = pathfinderApiClientBuilder(makeTestUser({ username: 'username' }))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPathfinderData', () => {
    it('should return data from the pathfinder api', async () => {
      const testResponse = { band: 3 }
      fakeApi.get('/pathfinder/nominal/noms-id/123').reply(200, testResponse)

      const output = await client.getPathfinderData('123')
      expect(output).toEqual(testResponse)
    })
  })
})
