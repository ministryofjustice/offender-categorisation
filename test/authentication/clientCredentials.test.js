const nock = require('nock')
const redis = require('redis')

const redisFunctions = { on: jest.fn(), get: jest.fn(), set: jest.fn() }
redis.createClient = jest.fn().mockReturnValue(redisFunctions)

const { config } = require('../../server/config')
const { generateOauthClientToken, getApiClientToken } = require('../../server/authentication/clientCredentials')

const clientToken = { access_token: 'client-token', expires_in: 300 }
let fakeOauthServer

beforeEach(() => {
  fakeOauthServer = nock(config.apis.oauth2.url)
})

afterEach(() => {
  nock.cleanAll()
  jest.resetAllMocks()
})

describe('generateAuthClientToken', () => {
  it('Token can be generated', () => {
    config.featureFlags.auth.useNewAuth = true
    expect(generateOauthClientToken('bob', 'password1')).toBe('Basic Ym9iOnBhc3N3b3JkMQ==')
  })

  it('uses legacy API_CLIENT_ID/SECRET when useNewAuth is false', () => {
    config.featureFlags.auth.useNewAuth = false
    const token = generateOauthClientToken('bob', 'password1')
    const decoded = Buffer.from(token.substring(6), 'base64').toString('utf-8')
    expect(decoded).toBe(`${config.apis.oauth2.apiClientId}:${config.apis.oauth2.apiClientSecret}`)
  })

  it('Token can be generated with special characters', () => {
    config.featureFlags.auth.useNewAuth = true
    const value = generateOauthClientToken('bob', "p@'s&sw/o$+ rd1")
    const decoded = Buffer.from(value.substring(6), 'base64').toString('utf-8')
    expect(decoded).toBe("bob:p@'s&sw/o$+ rd1")
  })
})

describe('getApiClientToken', () => {
  it('cache hit', async () => {
    redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

    const token = await getApiClientToken('user1')

    expect(token).toEqual({ body: { access_token: 'redis-token' } })
    expect(redisFunctions.get.mock.calls[0][0]).toEqual('user1')
    expect(redisFunctions.set).not.toBeCalled()
  })

  it('cache miss', async () => {
    redisFunctions.get.mockImplementation((key, callback) => callback(null, null))
    redisFunctions.set.mockImplementation((key, value, command, ttl, callback) => callback(null, null))
    fakeOauthServer.post('/oauth/token', 'grant_type=client_credentials&username=user1').reply(200, clientToken)

    const token = await getApiClientToken('user1')

    expect(token.body).toEqual({ access_token: 'client-token', expires_in: 300 })
    expect(redisFunctions.get.mock.calls[0][0]).toEqual('user1')
    expect(redisFunctions.set.mock.calls[0][0]).toEqual('user1')
    expect(redisFunctions.set.mock.calls[0][1]).toEqual('client-token')
    expect(redisFunctions.set.mock.calls[0][2]).toEqual('EX')
    expect(redisFunctions.set.mock.calls[0][3]).toEqual(240)
  })

  it('cache hit anon', async () => {
    redisFunctions.get.mockImplementation((key, callback) => callback(null, 'redis-token'))

    const token = await getApiClientToken()

    expect(token).toEqual({ body: { access_token: 'redis-token' } })
    expect(redisFunctions.get.mock.calls[0][0]).toEqual('%ANONYMOUS%')
    expect(redisFunctions.set).not.toBeCalled()
  })

  it('cache miss anon', async () => {
    redisFunctions.get.mockImplementation((key, callback) => callback(null, null))
    redisFunctions.set.mockImplementation((key, value, command, ttl, callback) => callback(null, null))
    fakeOauthServer.post('/oauth/token', 'grant_type=client_credentials').reply(200, clientToken)

    const token = await getApiClientToken()

    expect(token.body).toEqual({ access_token: 'client-token', expires_in: 300 })
    expect(redisFunctions.get.mock.calls[0][0]).toEqual('%ANONYMOUS%')
    expect(redisFunctions.set.mock.calls[0][0]).toEqual('%ANONYMOUS%')
    expect(redisFunctions.set.mock.calls[0][1]).toEqual('client-token')
    expect(redisFunctions.set.mock.calls[0][2]).toEqual('EX')
    expect(redisFunctions.set.mock.calls[0][3]).toEqual(240)
  })
})
