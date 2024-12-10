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
    expect(next).toHaveBeenCalledTimes(1)
    jest.resetAllMocks()
  })

  describe('SI-607', () => {
    test('should set si607EnabledPrisons in res.locals.featureFlags', async () => {
      const mockPrisonIds = 'prison1,prison2,prison3'
      config.featureFlags = { si607: mockPrisonIds }

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.si607EnabledPrisons).toEqual(['prison1', 'prison2', 'prison3'])
    })

    test('should handle empty SI-607 environment variable', async () => {
      config.featureFlags = { si607: '' }

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.si607EnabledPrisons).toEqual([''])
    })

    test('should handle undefined SI-607 environment variable', async () => {
      config.featureFlags = {}

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.si607EnabledPrisons).toEqual([''])
    })

    test('should handle whitespace in SI-607 environment variable', async () => {
      const mockPrisonIds = ' prison1 , prison2 , prison3 '
      config.featureFlags = { si607: mockPrisonIds }

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.si607EnabledPrisons).toEqual(['prison1', 'prison2', 'prison3'])
    })
  })
})
