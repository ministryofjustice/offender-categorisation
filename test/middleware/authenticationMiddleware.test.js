const authenticationMiddleware = require('../../server/middleware/authorisationMiddleware')

describe('authenticationMiddleware', () => {
  let req
  let res
  const next = jest.fn()

  beforeEach(() => {
    req = {
      originalUrl: '/categoriserHome',
    }

    res = {
      locals: {
        user: {
          // categoriser and security roles only
          token:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJDVF9TRUMiLCJzY29wZSI6WyJyZWFkIl0sImF1dGhfc291cmNlIjoibm9taXMiLCJleHAiOjE1NTk1NzEzMjAsImF1dGhvcml0aWVzIjpbIlJPTEVfQ0FURUdPUklTQVRJT05fU0VDVVJJVFkiLCJST0xFX0NSRUFURV9DQVRFR09SSVNBVElPTiJdLCJqdGkiOiI2NjFkYWRjNS0wZjY3LTRiYmMtYmZlMS04MWI1YzUwMDQzNDMiLCJjbGllbnRfaWQiOiJjYXRlZ29yaXNhdGlvbi10b29sIn0.lyISMyKmmB6vLv-_R1TkwXkJ6x0bdYJdLX7rpYHOV_C__zv68_YzHJaVDjmerpkJc-Rt6VzAgBjZ-oJRLExFbrmV4MWHUGfUKTU7APzt1-58ANhAepw9bQa5IGMLuZ9rXZ6L2IU6T3fYo5j8FcYSgqUNj_oqzyLIG-2boq6oSkfvSuhmhKz9yX29PyVIF-rec0ZrNRBX_L_sLf8EBanUcguXs7G7KXlhggh9jYZsdzFsdDpzABJ5LhGFzq65jJlSIIqhudO88Wl0vKTOf9NCoImh1JqZWgR5ddy3rM1KbelkSlHgA3Q2AN3kCqiU3xFI70uM3yeFV3k14z5EnIpN9Q',
        },
      },
    }
  })

  test('Should populate user.multipleRoles correctly', () => {
    authenticationMiddleware(req, res, next)

    expect(res.locals.user.multipleRoles).toEqual({
      categoriser: true,
      security: true,
    })
  })

  test('Should prevent access to unauthorised page', () => {
    const localReq = {
      ...req,
      originalUrl: '/supervisorHome', // does not have supervisor role
    }

    expect(res.locals.user.multipleRoles).toBeUndefined()

    authenticationMiddleware(localReq, res, next)
    expect(next).toBeCalledWith(new Error('Unauthorised access: required role not present'))
  })
})
