const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)
redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

const { config } = require('../../server/config')
const clientBuilder = require('../../server/data/prisonerSearchApi')

describe('prisonerSearchApi Client', () => {
  let fakeApi
  let client

  const response = { content: [{ bookingId: '123', releaseDate: '2040-01-02', sentenceStartDate: '2020-04-04' }] }

  beforeEach(() => {
    fakeApi = nock(`${config.apis.prisonerSearch.url}`)
    client = clientBuilder({ user: { username: 'username' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisonersAtLocation', () => {
    it('should return data from api', async () => {
      fakeApi.get('/prison/LEI/prisoners?size=1000000&fromDob=2000-01-01&toDob=2000-06-21').reply(200, response)

      const output = await client.getPrisonersAtLocation('LEI', '2000-01-01', '2000-06-21')
      return expect(output).toEqual([{ bookingId: 123, releaseDate: '2040-01-02', sentenceStartDate: '2020-04-04' }])
    })
  })

  describe('getPrisonersByBookingIds', () => {
    it('should return data from api', async () => {
      fakeApi.post(`/prisoner-search/booking-ids`, { bookingIds: [123, 321] }).reply(200, response.content)

      const output = await client.getPrisonersByBookingIds([123, 321])
      return expect(output).toEqual([{ bookingId: 123, releaseDate: '2040-01-02', sentenceStartDate: '2020-04-04' }])
    })

    it('should handle multiple batches', async () => {
      let i
      const b1000 = []
      const response1000 = []
      const b2000 = []
      const response2000 = []
      // eslint-disable-next-line no-plusplus
      for (i = 0; i < 1000; i++) {
        b1000[i] = i
        response1000[i] = { bookingId: i.toString() }
        b2000[i] = i + 1000
        response2000[i] = { bookingId: (i + 1000).toString() }
      }
      const b3000 = [2000, 2001, 2002]
      const response3000 = [{ bookingId: 2000 }, { bookingId: 2001 }, { bookingId: 2002 }]

      fakeApi.post(`/prisoner-search/booking-ids`, { bookingIds: b1000 }).reply(200, response1000)
      fakeApi.post(`/prisoner-search/booking-ids`, { bookingIds: b2000 }).reply(200, response2000)
      fakeApi.post(`/prisoner-search/booking-ids`, { bookingIds: b3000 }).reply(200, response3000)

      const allRecords = [...b1000, ...b2000, ...b3000]
      const output = await client.getPrisonersByBookingIds(allRecords)
      expect(output[0].bookingId).toEqual(0)
      expect(output[999].bookingId).toEqual(999)
      expect(output[1000].bookingId).toEqual(1000)
      expect(output[1999].bookingId).toEqual(1999)
      expect(output[2000].bookingId).toEqual(2000)
      expect(output[2001].bookingId).toEqual(2001)
      expect(output.length).toEqual(2003)
    })
  })
})
