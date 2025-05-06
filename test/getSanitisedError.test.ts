import { getSanitisedError } from '../server/getSanitisedError'

describe('sanitised error', () => {
  it('it should omit the request headers from the error object ', () => {
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
    })
  })

  it('it should return the error message ', () => {
    const error = {
      message: 'error description',
    }
    expect(getSanitisedError(error)).toEqual({
      message: 'error description',
    })
  })

  it('it should return an empty object for an unknown error structure', () => {
    const error = {
      property: 'unknown',
    }
    expect(getSanitisedError(error)).toEqual({})
  })
})
