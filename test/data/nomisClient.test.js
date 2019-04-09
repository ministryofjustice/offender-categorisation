const nock = require('nock')

const config = require('../../server/config')
const nomisClientBuilder = require('../../server/data/nomisClientBuilder')

describe('nomisClient', () => {
  let fakeElite2Api
  let nomisClient

  const uncatResponse = [{}]
  const sentenceResponse = [{}]

  beforeEach(() => {
    fakeElite2Api = nock(`${config.apis.elite2.url}`) // .log(console.log)
    nomisClient = nomisClientBuilder('username')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getUncategorisedOffenders', () => {
    it('should return data from api', async () => {
      fakeElite2Api.get(`/api/offender-assessments/category/LEI/uncategorised`).reply(200, uncatResponse)

      const output = await nomisClient.getUncategorisedOffenders('LEI')
      return expect(output).toEqual(uncatResponse)
    })
  })

  describe('getCategorisedOffenders', () => {
    it('should construct an api call', async () => {
      fakeElite2Api.post(`/api/offender-assessments/category/LEI`).reply(200, uncatResponse)

      const output = await nomisClient.getCategorisedOffenders('LEI')
      return expect(output).toEqual(uncatResponse)
    })
  })

  describe('getSentenceDatesForOffenders', () => {
    it('should return data from api', async () => {
      fakeElite2Api.post(`/api/offender-sentences/bookings`).reply(200, sentenceResponse)

      const output = await nomisClient.getSentenceDatesForOffenders([123, 321])
      return expect(output).toEqual(sentenceResponse)
    })
  })
})
