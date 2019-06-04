const { getPathFor, redirectUsingRole } = require('../../server/utils/routes')

describe('redirectUsingRole', () => {
  const res = {
    locals: {
      user: {
        // categoriser and security roles only
        token:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJDVF9TRUMiLCJzY29wZSI6WyJyZWFkIl0sImF1dGhfc291cmNlIjoibm9taXMiLCJleHAiOjE1NTk1NzEzMjAsImF1dGhvcml0aWVzIjpbIlJPTEVfQ0FURUdPUklTQVRJT05fU0VDVVJJVFkiLCJST0xFX0NSRUFURV9DQVRFR09SSVNBVElPTiJdLCJqdGkiOiI2NjFkYWRjNS0wZjY3LTRiYmMtYmZlMS04MWI1YzUwMDQzNDMiLCJjbGllbnRfaWQiOiJjYXRlZ29yaXNhdGlvbi10b29sIn0.lyISMyKmmB6vLv-_R1TkwXkJ6x0bdYJdLX7rpYHOV_C__zv68_YzHJaVDjmerpkJc-Rt6VzAgBjZ-oJRLExFbrmV4MWHUGfUKTU7APzt1-58ANhAepw9bQa5IGMLuZ9rXZ6L2IU6T3fYo5j8FcYSgqUNj_oqzyLIG-2boq6oSkfvSuhmhKz9yX29PyVIF-rec0ZrNRBX_L_sLf8EBanUcguXs7G7KXlhggh9jYZsdzFsdDpzABJ5LhGFzq65jJlSIIqhudO88Wl0vKTOf9NCoImh1JqZWgR5ddy3rM1KbelkSlHgA3Q2AN3kCqiU3xFI70uM3yeFV3k14z5EnIpN9Q',
      },
    },
    redirect: jest.fn(),
  }
  it('redirects to security home page', () => {
    const req = {
      session: { currentRole: 'security' },
    }

    redirectUsingRole(req, res, '/cat', '/sup', '/sec', '/recat')

    expect(res.redirect).toBeCalledWith('/sec')
  })
  it('redirects to categoriser home page', () => {
    const req = {
      session: { currentRole: 'categoriser' },
    }

    redirectUsingRole(req, res, '/cat', '/sup', '/sec', '/recat')

    expect(res.redirect).toBeCalledWith('/cat')
  })
  it('If no current role, redirects to categoriser (choice is categoriser and security)', () => {
    const req = { session: {} }

    redirectUsingRole(req, res, '/cat', '/sup', '/sec', '/recat')

    expect(res.redirect).toBeCalledWith('/cat')
    expect(req.session.currentRole).toEqual('categoriser')
  })
})

describe('getPathFor', () => {
  describe('when the nextPath is a string', () => {
    it('returns the nextPath', () => {
      const data = { decision: 'yes' }
      const config = { nextPath: { path: '/foo' } }
      const path = getPathFor({ data, config })

      expect(path).toEqual('/foo')
    })
  })

  describe('when the next path is an object with multiple exit points', () => {
    it('returns the correct nextPath for Yes', () => {
      const data = { fooAnswer: 'Yes' }
      const config = {
        nextPath: {
          decisions: {
            discriminator: 'fooAnswer',
            Yes: '/baz',
            No: '/bar',
          },
          path: '/foo',
        },
      }
      const path = getPathFor({ data, config })

      expect(path).toEqual('/baz')
    })
    it('returns the correct nextPath for No', () => {
      const data = { fooAnswer: 'No' }
      const config = {
        nextPath: {
          decisions: {
            discriminator: 'fooAnswer',
            Yes: '/ram',
            No: '/bar',
          },
          path: '/foo',
        },
      }
      const path = getPathFor({ data, config })

      expect(path).toEqual('/bar')
    })
  })

  describe('when the next path is an array with multiple exit points', () => {
    it('returns the nextPath of when there is a match', () => {
      const data = {
        fooAnswer: 'Yes',
        barAnswer: 'Yes',
        bazAnswer: 'No',
      }

      const config = {
        nextPath: {
          decisions: [
            {
              discriminator: 'fooAnswer',
              No: '/bar',
            },
            {
              discriminator: 'barAnswer',
              No: '/baz',
            },
            {
              discriminator: 'bazAnswer',
              No: '/bat',
            },
          ],
          path: '/foo',
        },
      }
      const path = getPathFor({ data, config })

      expect(path).toEqual('/bat')
    })

    it('returns the default path when there is no match', () => {
      const data = {
        fooAnswer: 'Yes',
        barAnswer: 'Yes',
        bazAnswer: 'Yes',
      }

      const config = {
        nextPath: {
          decisions: [
            {
              discriminator: 'fooAnswer',
              No: '/bar',
            },
            {
              discriminator: 'barAnswer',
              No: '/baz',
            },
            {
              discriminator: 'bazAnswer',
              No: '/foo',
            },
          ],
          path: '/bat',
        },
      }

      const path = getPathFor({ data, config })

      expect(path).toEqual('/bat')
    })
  })
})
