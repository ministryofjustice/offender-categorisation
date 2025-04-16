const dpsFrontEndComponentsMiddleware = require('../../server/middleware/dpsFrontEndComponentsMiddleware')
const logger = require('../../log').default

describe('dpsFrontEndComponentsMiddleware', () => {
  let mockComponentService
  let mockRequest
  let mockResponse
  let mockNext

  beforeEach(() => {
    mockComponentService = {
      getComponent: jest.fn(),
    }
    mockRequest = {}
    mockResponse = {
      locals: {
        user: {
          token: 'abc-123',
        },
      },
    }
    mockNext = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not make any api calls if res.locals.user.token is undefined', async () => {
    mockResponse.locals.user = undefined

    await dpsFrontEndComponentsMiddleware(mockComponentService)(mockRequest, mockResponse, mockNext)

    expect(mockComponentService.getComponent).not.toHaveBeenCalled()

    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should retrieve frontend components and set them in res.locals', async () => {
    const headerResponse = {
      html: '<header>Header Content</header>',
      css: ['header.css'],
      javascript: ['header.js'],
    }

    const footerResponse = {
      html: '<footer>Footer Content</footer>',
      css: ['footer.css'],
      javascript: ['footer.js'],
    }

    mockComponentService.getComponent.mockResolvedValueOnce(headerResponse).mockResolvedValueOnce(footerResponse)

    await dpsFrontEndComponentsMiddleware(mockComponentService)(mockRequest, mockResponse, mockNext)

    expect(mockResponse.locals.feComponents).toEqual({
      header: headerResponse.html,
      footer: footerResponse.html,
      cssIncludes: [...headerResponse.css, ...footerResponse.css],
      jsIncludes: [...headerResponse.javascript, ...footerResponse.javascript],
    })

    expect(mockComponentService.getComponent).toHaveBeenCalledTimes(2)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should handle errors and log them', async () => {
    const error = new Error('Test error')
    mockComponentService.getComponent.mockRejectedValueOnce(error)

    const errorLoggerSpy = jest.spyOn(logger, 'error')

    await dpsFrontEndComponentsMiddleware(mockComponentService)(mockRequest, mockResponse, mockNext)

    expect(mockResponse.locals.feComponents).toBeUndefined()
    expect(errorLoggerSpy).toHaveBeenCalledWith(error, 'Failed to retrieve front end components')
    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})
