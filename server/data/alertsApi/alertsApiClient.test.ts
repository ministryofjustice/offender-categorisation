// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock'
import { config } from '../../config'
import { makeTestUser } from '../user.test-factory'
import { alertsApiClientBuilder } from './alertsApiClient'
import { makeTestEscapeAlertDto } from './escapeAlert.dto.test-factory'

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue('redis-token'),
    set: jest.fn().mockResolvedValue('OK'),
  })),
}))

describe('alertsApiClientBuilder', () => {
  let fakeApi
  let client

  beforeEach(() => {
    fakeApi = nock(config.apis.alertsApi.url)
    client = alertsApiClientBuilder(makeTestUser({ username: 'username' }))
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getActivePrisonerEscapeAlerts', () => {
    it('should return data from alerts api', async () => {
      const testResponse = makeTestEscapeAlertDto()
      fakeApi.get('/prisoners/123/alerts').query({ isActive: true, alertCode: 'XER,XEL,XELH' }).reply(200, testResponse)

      const output = await client.getActivePrisonerEscapeAlerts('123')
      return expect(output).toEqual(testResponse)
    })
  })
})
