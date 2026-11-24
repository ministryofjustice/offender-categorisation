const serviceCreator = require('../../server/services/userService').default

const context = { user: { token: 'token', username: 'username', activeCaseLoad: { caseLoadId: 'LEI' } } }

const manageUsersApiClient = {
  getUserByUsername: jest.fn(),
  getUser: jest.fn(),
  getUserCaseload: jest.fn(),
}

const manageUsersApiClientBuilder = jest.fn(() => manageUsersApiClient)
let service

beforeEach(() => {
  service = serviceCreator(manageUsersApiClientBuilder)
})

afterEach(() => {
  manageUsersApiClient.getUserByUsername.mockReset()
  manageUsersApiClient.getUser.mockReset()
  manageUsersApiClient.getUserCaseload.mockReset()
  manageUsersApiClientBuilder.mockClear()
})

describe('getUserByUserId', () => {
  test('should return user details with display names', async () => {
    manageUsersApiClient.getUserByUsername.mockResolvedValue({
      username: 'user1',
      name: 'First Last',
      active: true,
      authSource: 'nomis',
      userId: '123',
    })

    const result = await service.getUserByUserId(context, 'user1')

    expect(manageUsersApiClientBuilder).toHaveBeenCalledWith(context.user.token)
    expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith('user1')
    expect(result).toEqual({
      username: 'user1',
      name: 'First Last',
      active: true,
      authSource: 'nomis',
      userId: '123',
      displayName: 'First Last',
      displayNameAlternative: 'First Last',
    })
  })
})

describe('getUser', () => {
  test('should set female flag in case loads', async () => {
    const caseLoads = { activeCaseload: { id: 'PFI' }, caseloads: [{ id: 'FKI' }, { id: 'PFI' }] }
    manageUsersApiClient.getUser.mockResolvedValue({ username: 'user1', name: 'First Last' })
    manageUsersApiClient.getUserCaseload.mockResolvedValue(caseLoads)

    const result = await service.getUser(context)

    const expected = [
      { caseLoadId: 'FKI', female: false },
      { caseLoadId: 'PFI', female: true },
    ]
    expect(manageUsersApiClientBuilder).toHaveBeenCalledWith(context.user.token)
    expect(result.activeCaseLoads).toEqual(expected)
    expect(result.activeCaseLoad).toEqual(expected[1])
    expect(result.displayName).toEqual('First Last')
    expect(result.displayNameAlternative).toEqual('First Last')
  })
})
