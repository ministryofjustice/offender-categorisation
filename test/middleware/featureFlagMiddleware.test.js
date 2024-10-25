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

  describe('Recategorisation prioritisation filter', () => {
    test('should set show_recategorisation_prioritisation_filter in res.locals.featureFlags from config', async () => {
      config.featureFlags = { recategorisationPrioritisation: { show_filter: 'true' } }

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.show_recategorisation_prioritisation_filter).toBeTruthy()
    })
    test('should set show_recategorisation_prioritisation_filter in res.locals.featureFlags from cookies', async () => {
      config.featureFlags = { recategorisationPrioritisation: { show_filter: 'false' } }

      await featureFlagMiddleware({ cookies: { show_recategorisation_prioritisation_filter: 'true' } }, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.show_recategorisation_prioritisation_filter).toBeTruthy()
    })
    test('should set show_recategorisation_prioritisation_filter to false in res.locals.featureFlags with no cookie or config', async () => {
      config.featureFlags = { recategorisationPrioritisation: { show_filter: 'false' } }

      await featureFlagMiddleware(req, res, next)

      expect(res.locals.featureFlags).toBeDefined()
      expect(res.locals.featureFlags.show_recategorisation_prioritisation_filter).toBeFalsy()
    })
  })
})
