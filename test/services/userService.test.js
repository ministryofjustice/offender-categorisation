const serviceCreator = require('../../server/services/userService')

const context = { user: { token: 'token', username: 'username', activeCaseLoad: { caseLoadId: 'LEI' } } }

const nomisClient = {
  getUserByUserId: jest.fn(),
  getUser: jest.fn(),
  getUserCaseLoads: jest.fn(),
}

const nomisClientBuilder = () => nomisClient
let service

beforeEach(() => {
  service = serviceCreator(nomisClientBuilder)
})

afterEach(() => {
  nomisClient.getUserByUserId.mockReset()
  nomisClient.getUser.mockReset()
  nomisClient.getUserCaseLoads.mockReset()
})

describe('female flag check', () => {
  beforeEach(() => {
    nomisClient.getUserCaseLoads.mockResolvedValue([{ caseLoadId: 'FKI' }, { caseLoadId: 'PFI' }])
  })

  test('getUserByUserId should set female flag in case loads', async () => {
    nomisClient.getUserByUserId.mockResolvedValue({ activeCaseLoadId: 'PFI' })
    const result = await service.getUserByUserId(context, 'user1')

    const expected = [
      { caseLoadId: 'FKI', female: false },
      { caseLoadId: 'PFI', female: true },
    ]
    expect(result.activeCaseLoads).toEqual(expected)
    expect(result.activeCaseLoad).toEqual(expected[1])
  })

  test('getUser should set female flag in case loads', async () => {
    nomisClient.getUser.mockResolvedValue({ activeCaseLoadId: 'PFI' })
    const result = await service.getUserByUserId(context)

    const expected = [
      { caseLoadId: 'FKI', female: false },
      { caseLoadId: 'PFI', female: true },
    ]
    expect(result.activeCaseLoads).toEqual(expected)
    expect(result.activeCaseLoad).toEqual(expected[1])
  })
})
