const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)
redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

const config = require('../../server/config')
const clientBuilder = require('../../server/data/risksAndNeedsApi')

describe('risksAndNeedsApi Client', () => {
  let fakeApi
  let client

  const response = {
    riskInCommunity: {
      'HIGH ': ['Children', 'Public', 'Know adult'],
      MEDIUM: ['Staff'],
      LOW: ['Prisoners'],
    },
    riskInCustody: {
      'HIGH ': ['Know adult'],
      VERY_HIGH: ['Staff', 'Prisoners'],
      LOW: ['Children', 'Public'],
    },
    assessedOn: '2024-08-16T01:02:04',
    overallRiskLevel: 'HIGH',
  }

  beforeEach(() => {
    fakeApi = nock(`${config.apis.risksAndNeeds.url}`)
    client = clientBuilder({ user: { username: 'username' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getRisksSummary', () => {
    it('should return data from api', async () => {
      fakeApi.get('/risks/crn/AN1234/summary').reply(200, response)

      const output = await client.getRisksSummary('AN1234')
      return expect(output).toEqual(response)
    })

    it('should handle a 404', async () => {
      fakeApi.get('/risks/crn/AN1235/summary').reply(404, {})

      const output = await client.getRisksSummary('AN1235')
      return expect(output).toEqual({})
    })

    it('should handle a 500', async () => {
      fakeApi.get(`/risks/crn/AN1236/summary`).reply(500, {})

      const output = await client.getRisksSummary('AN1236')
      return expect(output).toEqual({})
    })
  })
})
