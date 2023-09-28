const config = require('../../server/config')
const featureFlagMiddleware = require('../../server/middleware/featureFlagMiddleware')

describe('Feature Flag Middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      cookies: {},
    }
    res = {
      locals: {},
    }
    next = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should set feature flags based on config and cookies', async () => {
    config.featureFlags.dpsComponents.header = 'true'
    req.cookies.enableDpsComponentHeader = 'false'

    await featureFlagMiddleware(req, res, next)

    expect(res.locals.featureFlag.dpsHeader).toBe(true)
    expect(res.locals.featureFlag.dpsFooter).toBe(false)
  })

  it('should set feature flags to true if cookies are "true"', async () => {
    config.featureFlags.dpsComponents.header = false
    req.cookies.enableDpsComponentHeader = 'true'

    await featureFlagMiddleware(req, res, next)

    expect(res.locals.featureFlag.dpsHeader).toBe(true)
    expect(res.locals.featureFlag.dpsFooter).toBe(false)
  })

  it('should set feature flag "detected" to true if any feature is enabled', async () => {
    config.featureFlags.dpsComponents.header = false
    config.featureFlags.dpsComponents.footer = false
    req.cookies.enableDpsComponentHeader = 'false'
    req.cookies.enableDpsComponentFooter = 'true'

    await featureFlagMiddleware(req, res, next)

    expect(res.locals.featureFlag.detected).toBe(true)
  })

  it('should call next()', async () => {
    await featureFlagMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
