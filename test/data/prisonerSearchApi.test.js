const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)
redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

const config = require('../../server/config')
const clientBuilder = require('../../server/data/prisonerSearchApi')

describe('prisonerSearchApi Client', () => {
  let fakeApi
  let client

  const response = [{ bookingId: 123 }]

  beforeEach(() => {
    fakeApi = nock(`${config.apis.prisonerSearch.url}`)
    client = clientBuilder({ user: { username: 'username' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisonersAtLocation', () => {
    it('should return data from api', async () => {
      fakeApi.get(`/prison/LEI/prisoners?fromDob=2000-01-01&toDob=2000-06-21`).reply(200, response)

      const output = await client.getPrisonersAtLocation('LEI', '2000-01-01', '2000-06-21')
      return expect(output).toEqual(response)
    })
  })

  describe('getSentenceDatesForOffenders', () => {
    it('should return data from api', async () => {
      fakeApi.post(`/prisoner-search/booking-ids`, { bookingIds: [123, 321] }).reply(200, response)

      const output = await client.getSentenceDatesForOffenders([123, 321])
      return expect(output).toEqual(response)
    })
  })
})
