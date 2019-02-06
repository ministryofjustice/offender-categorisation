const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/tasklist')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

const formService = {
  getCategorisationRecord: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCategoryHistory: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const tasklistRoute = createRouter({ formService, offendersService, userService, authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  offendersService.getOffenderDetails.mockResolvedValue({
    sentence: {
      bookingId: 12345,
      releaseDate: '2019-01-01',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      automaticReleaseDate: '2020-06-11',
      conditionalReleaseDate: '2020-02-02',
      paroleEligibilityDate: '2020-06-13',
      nonParoleDate: '2020-06-14',
      tariffDate: '2020-06-15',
      licenceExpiryDate: '2020-06-16',
      sentenceExpiryDate: '2020-06-17',
    },
  })
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  offendersService.getOffenderDetails.mockReset()
  formService.update.mockReset()
})

describe('GET /tasklist/', () => {
  test('should render tasklist', () =>
    request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        console.log('Got response')
        expect(res.text).toContain('Categorisation task list')
        expect(res.text).toContain('Offending history')
        expect(res.text).toContain('Not yet checked')
      }))

  test('should render categoriserSubmitted page', () =>
    request(app)
      .get('/categoriserSubmitted/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        console.log('Got response')
        expect(res.text).toContain('Submitted for approval')
      }))
})
