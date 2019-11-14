const nock = require('nock')
const config = require('../../server/config')
const nomisClientBuilder = require('../../server/data/nomisClientBuilder')

describe('nomisClient', () => {
  let fakeElite2Api
  let fakeOauth
  let nomisClient

  const uncatResponse = [{}]
  const sentenceResponse = [{}]
  const emptyListResponse = [{}]

  beforeEach(() => {
    fakeElite2Api = nock(`${config.apis.elite2.url}`) // .log(console.log)
    fakeOauth = nock(`${config.apis.oauth2.url}`) // .log(console.log)
    nomisClient = nomisClientBuilder({ user: { username: 'myuser', token: '1234321' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUncategorisedOffenders', () => {
    it('should return data from api', async () => {
      fakeElite2Api.get(`/api/offender-assessments/category/LEI?type=UNCATEGORISED`).reply(200, uncatResponse)

      const output = await nomisClient.getUncategorisedOffenders('LEI')
      return expect(output).toEqual(uncatResponse)
    })
  })

  describe('getCategorisedOffenders', () => {
    it('should construct an api call', async () => {
      fakeOauth.post(`/oauth/token`, 'grant_type=client_credentials&username=myuser').reply(200, '')
      fakeElite2Api.post(`/api/offender-assessments/category?latestOnly=false`).reply(200, uncatResponse)

      const output = await nomisClient.getCategorisedOffenders(['1', '2'])
      return expect(output).toEqual(uncatResponse)
    })
  })

  describe('getAgencyDetail', () => {
    it('should construct an api call', async () => {
      const agencyResponse = { description: 'Moorlands' }
      fakeElite2Api.get(`/api/agencies/LEI?activeOnly=false`).reply(200, agencyResponse)

      const output = await nomisClient.getAgencyDetail('LEI')
      return expect(output).toEqual(agencyResponse)
    })
  })

  describe('getSentenceDatesForOffenders', () => {
    it('should return data from api', async () => {
      fakeElite2Api.post(`/api/offender-sentences/bookings`).reply(200, sentenceResponse)

      const output = await nomisClient.getSentenceDatesForOffenders([123, 321])
      return expect(output).toEqual(sentenceResponse)
    })
  })

  describe('getCategoryHistory', () => {
    it('should construct an api call', async () => {
      fakeElite2Api
        .get(`/api/offender-assessments/CATEGORY?offenderNo=1234&latestOnly=false&activeOnly=false`)
        .reply(200, uncatResponse)

      const output = await nomisClient.getCategoryHistory(1234)
      return expect(output).toEqual(uncatResponse)
    })
  })

  describe('getOffenderDetailList', () => {
    it('should return data from api', async () => {
      fakeOauth.post(`/oauth/token`, 'grant_type=client_credentials&username=myuser').reply(200, '')
      fakeElite2Api.post(`/api/bookings/offenders?activeOnly=false`).reply(200, emptyListResponse)

      const output = await nomisClient.getOffenderDetailList([123, 321])
      return expect(output).toEqual(emptyListResponse)
    })
  })
})
