import { getSanitisedError } from '../server/getSanitisedError'

describe('sanitised error', () => {
  it('should sanitise a 404 superagent response and exclude request headers', () => {
    const error = {
      status: 404,
      response: {
        req: {
          method: 'GET',
          url: 'https://test-api/endpoint?active=true',
          headers: {
            property: 'not for logging',
          },
        },
        res: { statusMessage: 'hi there' },
        headers: {
          date: 'Tue, 19 May 2020 15:16:20 GMT',
        },
        status: 404,
        statusText: 'Not found',
        body: { content: 'hello' },
      },
      message: 'Not Found',
      stack: 'stack description',
    }

    expect(getSanitisedError(error)).toEqual({
      headers: { date: 'Tue, 19 May 2020 15:16:20 GMT' },
      message: 'hi there',
      stack: 'stack description',
      status: 404,
      statusText: 'Not found',
      data: { content: 'hello' },
      type: 'response',
    })
  })

  it('it should return the error message ', () => {
    const error = {
      message: 'error description',
    }
    expect(getSanitisedError(error)).toEqual({
      message: 'error description',
      type: 'generic',
    })
  })

  it('should return a default generic error for an unknown error structure', () => {
    const error = {
      property: 'unknown',
    }
    expect(getSanitisedError(error)).toEqual({
      type: 'generic',
      message: 'Unknown error',
    })
  })

  it('should return a generic error for null input', () => {
    expect(getSanitisedError(null)).toEqual({
      type: 'generic',
      message: 'null',
    })
  })

  it('should return a generic error for string input', () => {
    expect(getSanitisedError('fail')).toEqual({
      type: 'generic',
      message: 'fail',
    })
  })

  it('should return a generic error for number input', () => {
    expect(getSanitisedError(123)).toEqual({
      type: 'generic',
      message: '123',
    })
  })

  it('should return a request error when request exists but response does not', () => {
    const error = {
      request: {},
      message: 'timeout',
      code: 'ECONNABORTED',
      stack: 'stack trace',
    }

    expect(getSanitisedError(error)).toEqual({
      type: 'request',
      message: 'timeout',
      code: 'ECONNABORTED',
      stack: 'stack trace',
    })
  })

  it('should fallback to status if message is missing', () => {
    const error = {
      response: {
        status: 500,
        headers: {},
        body: null,
      },
      message: '',
    }

    expect(getSanitisedError(error)).toEqual({
      type: 'response',
      status: 500,
      message: 'Unknown response error',
      headers: {},
      data: null,
    })
  })
})
