import CreateRiskService from './riskService'

const alertsApiClient = {
  getActivePrisonerEscapeAlerts: jest.fn(),
}

const alertsApiClientBuilder = jest.fn()

const mockUser = { username: 'testUser' }

const mockResponse = {
  content: [
    {
      alertCode: {
        code: 'ABC',
      },
      activeFrom: '12/02/2024',
    },
  ],
}

let service

beforeEach(() => {
  alertsApiClientBuilder.mockReturnValue(alertsApiClient)
  alertsApiClient.getActivePrisonerEscapeAlerts.mockReturnValue(mockResponse)
  service = new CreateRiskService(alertsApiClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getActivePrisonerAlerts', () => {
  it('should call alertsApiClient with correct params', () => {
    service.getEscapeProfile('ABC', mockUser)

    expect(alertsApiClient.getActivePrisonerEscapeAlerts).toBeCalledWith('ABC')
  })
})
