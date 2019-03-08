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
  getUnapprovedOffenders: jest.fn(),
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
  offendersService.getUnapprovedOffenders.mockResolvedValue({})
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI' })
})

afterEach(() => {
  offendersService.getCategorisedOffenders.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getUnapprovedOffenders.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  userService.getUser.mockReset()
})

describe('GET /categoriserDone', () => {
  test('results', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        assessmentDate: '2017-03-27',
        approvalDate: '2019-02-21',
        assessmentSeq: 7,
        categoriserFirstName: 'JOHN',
        categoriserLastName: 'LAMB',
        approverFirstName: 'JAMES',
        approverLastName: 'HELLY',
        category: 'C',
      },
    ])
    return request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Tim Handle')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })

  test('no results', () =>
    request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No categorised offenders found')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      }))
})

describe('GET /supervisorHome', () => {
  test('results for categorisation outside of cat tool', () => {
    offendersService.getUnapprovedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        category: 'C',
      },
    ])
    return request(app)
      .get('/supervisorHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('PNOMIS') // should not display start button
        expect(offendersService.getUnapprovedOffenders).toBeCalledTimes(1)
      })
  })
})
