const nock = require('nock')
const { serviceCheckFactory, dbCheck } = require('../../server/data/healthCheck')
const db = require('../../server/data/dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

describe('service healthcheck', () => {
  const healthcheck = serviceCheckFactory('externalService', 'http://test-service.com/ping')
  let fakeServiceApi

  beforeEach(() => {
    fakeServiceApi = nock('http://test-service.com')
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('check healthy', () => {
    it('should return data from api', async () => {
      fakeServiceApi.get('/ping').reply(200, 'pong')

      const output = await healthcheck()
      expect(output).toEqual('UP')
    })
  })

  describe('check unhealthy', () => {
    it('should throw error from api', async () => {
      fakeServiceApi.get('/ping').thrice().reply(500)

      await expect(healthcheck()).rejects.toThrow('Internal Server Error')
    })
  })

  describe('check healthy retry test', () => {
    it('Should retry twice if request fails', async () => {
      fakeServiceApi
        .get('/ping')
        .reply(500, { failure: 'one' })
        .get('/ping')
        .reply(500, { failure: 'two' })
        .get('/ping')
        .reply(200, 'pong')

      const response = await healthcheck()
      expect(response).toEqual('UP')
    })

    it('Should retry twice if request times out', async () => {
      fakeServiceApi
        .get('/ping')
        .delay(10000) // delay set to 10s, timeout to 900/3=300ms
        .reply(200, { failure: 'one' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'two' })
        .get('/ping')
        .reply(200, 'pong')

      const response = await healthcheck()
      expect(response).toEqual('UP')
    })

    it('Should fail if request times out three times', async () => {
      fakeServiceApi
        .get('/ping')
        .delay(10000) // delay set to 10s, timeout to 900/3=300ms
        .reply(200, { failure: 'one' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'two' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'three' })

      await expect(healthcheck()).rejects.toThrow('Response timeout of 1000ms exceeded')
    })
  })

  describe('dbCheck', () => {
    beforeEach(() => {
      db.query = jest.fn()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true when the database query succeeds', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ ok: 1 }] })

      const result = await dbCheck()

      expect(result).toBe(true)
      expect(db.query).toHaveBeenCalledWith('SELECT 1 AS ok')
    })

    it('should throw when the database query fails', async () => {
      const errorMessage = 'Database connection failed'
      db.query.mockRejectedValueOnce(new Error(errorMessage))

      await expect(dbCheck()).rejects.toThrow(errorMessage)
      expect(db.query).toHaveBeenCalledWith('SELECT 1 AS ok')
    })

    describe('timeout', () => {
      beforeEach(() => {
        jest.useFakeTimers()
      })

      afterEach(() => {
        jest.clearAllTimers()
      })

      it('should throw when the query takes too long', async () => {
        db.query.mockImplementation(() => new Promise(() => {}))

        const dbCheckPromise = dbCheck()
        jest.advanceTimersByTime(120000)
        await expect(dbCheckPromise).rejects.toThrow('Database Connection test timed out')
      })

      it('should not throw if the query resolves before timeout', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ ok: 1 }] })

        const dbCheckPromise = dbCheck()

        jest.advanceTimersByTime(1000)
        const result = await dbCheckPromise

        expect(result).toBe(true)
        expect(db.query).toHaveBeenCalledWith('SELECT 1 AS ok')
      })
    })
  })
})
