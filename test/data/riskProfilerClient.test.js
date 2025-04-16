const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)
redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

const { config } = require('../../server/config')
const riskProfilerClientBuilder = require('../../server/data/riskProfilerClientBuilder')

describe('riskProfilerClient', () => {
  let fakeRiskProfilerApi
  let riskProfilerClient

  const socProfileResponse = {
    nomsId: 'A1234AA',
    riskType: 'SOC',
    provisionalCategorisation: 'C',
    transferToSecurity: true,
  }

  beforeEach(() => {
    fakeRiskProfilerApi = nock(`${config.apis.riskProfiler.url}`)
    riskProfilerClient = riskProfilerClientBuilder({ user: { username: 'username' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getSocProfile', () => {
    it('should return data from api', async () => {
      fakeRiskProfilerApi.get(`/risk-profile/soc/AN1234`).reply(200, socProfileResponse)

      const output = await riskProfilerClient.getSocProfile('AN1234')
      return expect(output).toEqual(socProfileResponse)
    })
  })
})
