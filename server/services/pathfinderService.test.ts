import { mapDataToExtremismProfile } from '../utils/extremismProfileMapper'
import logger = require('../../log')
import CreatePathfinderService from './pathfinderService'

jest.mock('../utils/extremismProfileMapper')
jest.mock('../../log')

const mockTransformDataToProfile = jest.mocked(mapDataToExtremismProfile)
const mockedLogger = jest.mocked(logger)

const mockGetPathfinderData = jest.fn()
const mockPathfinderApiClientBuilder = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockPathfinderApiClientBuilder.mockReturnValue({
    getPathfinderData: mockGetPathfinderData,
  })
})

describe('CreatePathfinderService', () => {
  const user = { username: 'test-user' }
  const offenderNo = '123'

  it('returns transformed profile when the api responds successfully', async () => {
    mockGetPathfinderData.mockResolvedValue({ band: 3 })
    mockTransformDataToProfile.mockReturnValue({ notifyRegionalCTLead: true, increasedRiskOfExtremism: false })

    const service = new CreatePathfinderService(mockPathfinderApiClientBuilder)
    const result = await service.getExtremismProfile(offenderNo, user)

    expect(result).toEqual({ notifyRegionalCTLead: true, increasedRiskOfExtremism: false })
  })

  it('returns default response when the api returns a 404', async () => {
    mockGetPathfinderData.mockRejectedValue({ status: 404 })

    const service = new CreatePathfinderService(mockPathfinderApiClientBuilder)
    const result = await service.getExtremismProfile(offenderNo, user)

    expect(result).toEqual({ notifyRegionalCTLead: false, increasedRiskOfExtremism: false })
  })

  it('logs and rethrows non-404 errors', async () => {
    const error = { status: 500 }
    mockGetPathfinderData.mockRejectedValue(error)

    const service = new CreatePathfinderService(mockPathfinderApiClientBuilder)

    await expect(service.getExtremismProfile(offenderNo, user)).rejects.toEqual(error)
    expect(mockedLogger.error).toHaveBeenCalledWith(error)
  })
})
