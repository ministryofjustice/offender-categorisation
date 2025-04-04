const authorisationMiddleware = require('../../server/middleware/authorisationMiddleware')

const BASIC_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJTUkVOREVMTF9BRE0iLCJzY29wZSI6WyJyZWFkIiwid3JpdGUiXSwiYXV0aF9zb3VyY2UiOiJub21pcyIsImV4cCI6MTU2NzYwMjUwNywiYXV0aG9yaXRpZXMiOlsiUk9MRV9NQUlOVEFJTl9BQ0NFU1NfUk9MRVNfQURNSU4iLCJST0xFX1VQREFURV9BTEVSVCIsIlJPTEVfT01JQ19BRE1JTiIsIlJPTEVfT0FVVEhfQURNSU4iXSwianRpIjoiMWJjMjIyOWQtYTcxNS00OGQyLTljMGQtMTBmYzI4MGRmZmI3IiwiY2xpZW50X2lkIjoibWFuYWdlLWtleS13b3JrZXJzIn0.ymtLrrAqSkY8ikXbMNEtehp7t4FnP_1la4GTPXC0MogtGJ_j0Zm_OV1VC7arnpGSL8JF7opD19EJeyzASTsOkbcXe1YpdlU-LkOohMj5ex4B57uUK7XQAdQHa4aTJY0CLn-mwaJ1WoxV_mFLHAzgwrXl6PpRm6l19tD7hlFM2-W8e8yJlPZRF1oyC3K8DuZojDyV-JZZI1mt4rvLosPTuDlmHdsuptE4rAFdNCYB22dn-zGdRUvl8adcZbj1tSWyLbVB97xWGPSUUQO94TBiLyqZN2_gBhaVBda9UpfXhBMRHHQ5WNPOdhf-gfp27AxmSWESUaFvYuwACIx5y_HHeQ'
const CATEGORISER_AND_SECURITY =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJDVF9TRUMiLCJzY29wZSI6WyJyZWFkIl0sImF1dGhfc291cmNlIjoibm9taXMiLCJleHAiOjE1NTk1NzEzMjAsImF1dGhvcml0aWVzIjpbIlJPTEVfQ0FURUdPUklTQVRJT05fU0VDVVJJVFkiLCJST0xFX0NSRUFURV9DQVRFR09SSVNBVElPTiJdLCJqdGkiOiI2NjFkYWRjNS0wZjY3LTRiYmMtYmZlMS04MWI1YzUwMDQzNDMiLCJjbGllbnRfaWQiOiJjYXRlZ29yaXNhdGlvbi10b29sIn0.lyISMyKmmB6vLv-_R1TkwXkJ6x0bdYJdLX7rpYHOV_C__zv68_YzHJaVDjmerpkJc-Rt6VzAgBjZ-oJRLExFbrmV4MWHUGfUKTU7APzt1-58ANhAepw9bQa5IGMLuZ9rXZ6L2IU6T3fYo5j8FcYSgqUNj_oqzyLIG-2boq6oSkfvSuhmhKz9yX29PyVIF-rec0ZrNRBX_L_sLf8EBanUcguXs7G7KXlhggh9jYZsdzFsdDpzABJ5LhGFzq65jJlSIIqhudO88Wl0vKTOf9NCoImh1JqZWgR5ddy3rM1KbelkSlHgA3Q2AN3kCqiU3xFI70uM3yeFV3k14z5EnIpN9Q'

const offendersService = {
  getBasicOffenderDetails: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

afterEach(() => {
  jest.resetAllMocks()
})

describe('authorisationMiddleware roles', () => {
  let req
  let res
  const next = jest.fn()

  beforeEach(() => {
    req = { originalUrl: '/categoriserHome' }
    res = { locals: { user: { token: CATEGORISER_AND_SECURITY } } }
  })

  test('Should populate user multiple roles correctly', () => {
    authorisationMiddleware(userService, offendersService)(req, res, next)

    expect(res.locals.user.roles).toEqual({
      categoriser: true,
      security: true,
    })
  })

  test('Should prevent access to unauthorised page', () => {
    const localReq = {
      ...req,
      originalUrl: '/supervisorHome', // does not have supervisor role
    }

    expect(res.locals.user.roles).toBeUndefined()

    authorisationMiddleware(userService, offendersService)(localReq, res, next)
    expect(next).toBeCalledWith(new Error('Unauthorised access: required role not present'))
  })

  test('Should allow generic users if bookingId in caseload', async () => {
    userService.getUser.mockResolvedValue({ activeCaseLoads: [{ caseLoadId: 'LEI' }] })
    offendersService.getBasicOffenderDetails.mockResolvedValue({ agencyId: 'LEI' })

    // no cat tool related roles
    const genericRes = { locals: { user: { token: BASIC_TOKEN } } }

    await authorisationMiddleware(userService, offendersService)(
      { originalUrl: '/categoryHistory/123', path: '/categoryHistory/123' },
      genericRes,
      next,
    )

    expect(next).toBeCalledWith()
  })

  test('Should not allow generic users if bookingId not in caseload', async () => {
    userService.getUser.mockResolvedValue({ activeCaseLoads: [{ caseLoadId: 'LEI' }] })
    offendersService.getBasicOffenderDetails.mockResolvedValue({ agencyId: 'BXI' })

    // no cat tool related roles
    const genericRes = { locals: { user: { token: BASIC_TOKEN } } }

    await authorisationMiddleware(userService, offendersService)(
      { originalUrl: '/categoryHistory/123', path: '/categoryHistory/123' },
      genericRes,
      next,
    )

    expect(next).toBeCalledWith(new Error('Prisoner is not in this prison'))
  })

  test('Should not allow generic users if bookingId not present', async () => {
    userService.getUser.mockResolvedValue({ activeCaseLoads: [{ caseLoadId: 'LEI' }] })
    offendersService.getBasicOffenderDetails.mockResolvedValue({ agencyId: 'BXI' })

    // no cat tool related roles
    const genericRes = { locals: { user: { token: BASIC_TOKEN } } }

    await authorisationMiddleware(userService, offendersService)(
      { originalUrl: '/form/approvedView/invalid', path: '/form/approvedView/invalid' },
      genericRes,
      next,
    )

    expect(next).toBeCalledWith(new Error('Url not recognised')) // blocked by auth config
  })

  test('Should not allow generic users if bookingId does not exist', async () => {
    userService.getUser.mockResolvedValue({ activeCaseLoads: [{ caseLoadId: 'LEI' }] })
    offendersService.getBasicOffenderDetails.mockRejectedValue(new Error('404 error'))

    // no cat tool related roles
    const genericRes = { locals: { user: { token: BASIC_TOKEN } } }

    await authorisationMiddleware(userService, offendersService)(
      { originalUrl: '/categoryHistory/123', path: '/categoryHistory/123' },
      genericRes,
      next,
    )

    expect(next).toBeCalledWith(new Error('Booking id not found'))
  })
})
