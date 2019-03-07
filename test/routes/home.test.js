const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/home')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createInitialCategorisation: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const homeRoute = createRouter({
  authenticationMiddleware,
  userService,
  offendersService,
})

let app

beforeEach(() => {
  app = appSetup(homeRoute)
  offendersService.getOffenderDetails.mockResolvedValue({})
  offendersService.getCategorisedOffenders.mockResolvedValue({})
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI' })
})

afterEach(() => {
  offendersService.getCategorisedOffenders.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  userService.getUser.mockReset()
})

describe('GET /categoriserDone', () => {
  test.each`
    path                 | expectedContent
    ${'categoriserDone'} | ${'No categorised offenders found'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  )
})

describe('GET /categoriserDone', () => {
  test.each`
    path                 | expectedContent
    ${'categoriserDone'} | ${'No categorised offenders found'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  )
})
