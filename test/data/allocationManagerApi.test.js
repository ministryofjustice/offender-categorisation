const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)
redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

const { config } = require('../../server/config')
const clientBuilder = require('../../server/data/allocationManagerApi')

describe('allocationManagerApi Client', () => {
  let fakeApi
  let client

  const response = {
    primary_pom: {
      name: 'Humperdinck, Engelbert',
      staff_id: 12345,
    },
    secondary_pom: {
      name: 'Depp, Johnny',
      staff_id: 6789,
    },
  }

  beforeEach(() => {
    fakeApi = nock(`${config.apis.allocationManager.url}`)
    client = clientBuilder({ user: { username: 'username' } })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPomByOffenderNo', () => {
    it('should return data from api', async () => {
      fakeApi.get(`/api/allocation/AN1234`).reply(200, response)

      const output = await client.getPomByOffenderNo('AN1234')
      return expect(output).toEqual(response)
    })

    it('should handle a 404', async () => {
      fakeApi.get(`/api/allocation/AN1235`).reply(404, {})

      const output = await client.getPomByOffenderNo('AN1235')
      return expect(output).toEqual({})
    })

    it('should handle a 500', async () => {
      fakeApi.get(`/api/allocation/AN1236`).reply(500, {})

      const output = await client.getPomByOffenderNo('AN1236')
      return expect(output).toEqual({})
    })
  })
})
