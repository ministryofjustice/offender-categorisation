const nock = require('nock')

const config = require('../../server/config')
const riskProfilerClientBuilder = require('../../server/data/riskProfilerClientBuilder')

describe('riskProfilerClient', () => {
  let fakeRiskProfilerApi
  let fakeNomisAuth
  let riskProfilerClient

  const socProfileResponse = {
    nomsId: 'A1234AA',
    riskType: 'SOC',
    provisionalCategorisation: 'C',
    transferToSecurity: true,
  }

  beforeEach(() => {
    fakeNomisAuth = nock(`${config.apis.oauth2.url}`)
    fakeRiskProfilerApi = nock(`${config.apis.riskProfiler.url}`)
    riskProfilerClient = riskProfilerClientBuilder('username')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getSocProfile', () => {
    it('should return data from api', async () => {
      fakeNomisAuth.post(`/oauth/token`).reply(200, { access_token: 'token123' })
      fakeRiskProfilerApi.get(`/risk-profile/soc/AN1234`).reply(200, socProfileResponse)

      const output = await riskProfilerClient.getSocProfile('AN1234')
      return expect(output).toEqual(socProfileResponse)
    })
  })
})
