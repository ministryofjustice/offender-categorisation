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

  test('Should call next', () => {
    featureFlagMiddleware(req, res, next)
  })
})
