import nock from 'nock'
import config from '../../config'
import clientBuilder from './probationOffenderSearchApiClient'
import { makeTestUser } from '../user.test-factory'
import { makeTestProbationOffenderSearchOffenderDto } from './probationOffenderSearchOffender.dto.test-factory'

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

describe('probationOffenderSearchApiClient', () => {
  let fakeApi
  let client

  beforeEach(() => {
    fakeApi = nock(config.apis.probationOffenderSearch.url)
    client = clientBuilder(makeTestUser({ username: 'username' }))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('matchPrisoners', () => {
    it('should return data from api', async () => {
      const testResponse = makeTestProbationOffenderSearchOffenderDto()
      fakeApi.post('/nomsNumbers').reply(200, testResponse)

      const output = await client.matchPrisoners(['AN1234'])
      return expect(output).toEqual(testResponse)
    })

    it('should handle a 404', async () => {
      fakeApi.get('/nomsNumbers').reply(404, {})

      const output = await client.matchPrisoners(['AN1235'])
      return expect(output).toEqual(undefined)
    })
  })
})
