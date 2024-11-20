import { getMockReq, getMockRes } from '@jest-mock/express'
import { bookingExistsAtCurrentEstablishmentMiddleware } from './bookingExistsAtCurrentEstablishmentMiddleware'
import { makeTestUserDto } from '../services/user/user.dto.test-factory'
import { makeTestBasicOffenderDetailsDto } from '../services/offender/basicOffenderDetails.dto.test-factory'

const mockUserService = {
  getUser: jest.fn(),
}
const mockOffenderService = {
  getBasicOffenderDetails: jest.fn(),
}
const { res, clearMockRes } = getMockRes({ locals: {} })
const testAgencyId = 'TEST'
const testParams = { bookingId: '123456' }
afterEach(() => {
  jest.resetAllMocks()
  clearMockRes()
})

describe('bookingExistsAtCurrentEstablishmentMiddleware', () => {
  const next = jest.fn()
  const middleware = bookingExistsAtCurrentEstablishmentMiddleware(mockUserService, mockOffenderService)

  test('it fails when there is no booking ID', async () => {
    await middleware(getMockReq(), res, next)

    expect(mockUserService.getUser).not.toHaveBeenCalled()
    expect(mockOffenderService.getBasicOffenderDetails).not.toHaveBeenCalled()
    expect(next).toBeCalledTimes(1)
    expect(next).toBeCalledWith(new Error('bookingExistsAtCurrentEstablishmentMiddleware: No booking id in params'))
  })

  describe('with booking ID', () => {
    afterEach(() => {
      expect(mockUserService.getUser).toBeCalledTimes(1)
      expect(mockOffenderService.getBasicOffenderDetails).toBeCalledTimes(1)
      expect(next).toBeCalledTimes(1)
    })

    test('it works correctly with matching agency IDs', async () => {
      mockUserService.getUser.mockResolvedValue(makeTestUserDto({ activeCaseLoad: { caseLoadId: testAgencyId } }))
      mockOffenderService.getBasicOffenderDetails.mockResolvedValue(
        makeTestBasicOffenderDetailsDto({ agencyId: testAgencyId })
      )

      await middleware(getMockReq({ params: testParams }), res, next)
    })

    test('it fails when the agency IDs do not match', async () => {
      mockUserService.getUser.mockResolvedValue(makeTestUserDto({ activeCaseLoad: { caseLoadId: testAgencyId } }))
      mockOffenderService.getBasicOffenderDetails.mockResolvedValue(
        makeTestBasicOffenderDetailsDto({ agencyId: 'BLA' })
      )
      await middleware(getMockReq({ params: testParams }), res, next)

      expect(next).toBeCalledWith(
        new Error(
          'bookingExistsAtCurrentEstablishmentMiddleware: booking agency ID does not match to the active caseload'
        )
      )
    })

    test('it handles undefined response for getUser', async () => {
      mockUserService.getUser.mockResolvedValue(undefined)
      mockOffenderService.getBasicOffenderDetails.mockResolvedValue(
        makeTestBasicOffenderDetailsDto({ agencyId: testAgencyId })
      )
      await middleware(getMockReq({ params: testParams }), res, next)

      expect(next).toBeCalledWith(
        new Error(
          'bookingExistsAtCurrentEstablishmentMiddleware: booking agency ID does not match to the active caseload'
        )
      )
    })

    test('it handles undefined response for getBasicOffenderDetails', async () => {
      mockUserService.getUser.mockResolvedValue(makeTestUserDto({ activeCaseLoad: { caseLoadId: testAgencyId } }))
      mockOffenderService.getBasicOffenderDetails.mockResolvedValue(undefined)
      await middleware(getMockReq({ params: testParams }), res, next)

      expect(next).toBeCalledWith(
        new Error(
          'bookingExistsAtCurrentEstablishmentMiddleware: booking agency ID does not match to the active caseload'
        )
      )
    })
  })
})
