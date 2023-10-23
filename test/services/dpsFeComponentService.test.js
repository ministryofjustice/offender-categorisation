const createDpsFeComponentService = require('../../server/services/dpsFeComponentService')

const mockDpsFeComponentsClientBuilder = jest.fn()

const mockClient = {
  getComponent: jest.fn(),
}

const mockContext = {}

const service = createDpsFeComponentService(mockDpsFeComponentsClientBuilder)

describe('dpsFeComponentService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    mockDpsFeComponentsClientBuilder.mockReturnValue(mockClient)
  })

  it('should call dpsFeComponentsClientBuilder with the provided context', () => {
    service.getComponent('exampleComponent', mockContext)

    expect(mockDpsFeComponentsClientBuilder).toHaveBeenCalledWith(mockContext)
  })

  it('should call getComponent on the client object', () => {
    service.getComponent('exampleComponent', mockContext)

    expect(mockClient.getComponent).toHaveBeenCalledWith('exampleComponent')
  })

  it('should return the result from getComponent', () => {
    mockClient.getComponent.mockReturnValue('componentData')

    const result = service.getComponent('exampleComponent', mockContext)

    expect(result).toBe('componentData')
  })
})
