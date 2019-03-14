const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/tasklist')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const moment = require('moment')

const formService = {
  getCategorisationRecord: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  createOrRetrieveCategorisationRecord: jest.fn(),
  updateFormData: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
}

const riskProfilerService = {
  getSecurityProfile: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCatAInformation: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const tasklistRoute = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
  riskProfilerService,
})

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.createOrRetrieveCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
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
  formService.referToSecurityIfRiskAssessed.mockReset()
  formService.updateFormData.mockReset()
  formService.createOrRetrieveCategorisationRecord.mockReset()
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
        expect(res.text).toContain('Categorisation task list')
        expect(res.text).toContain('Offending history')
        expect(res.text).toContain('Not yet checked')
      }))

  test('should display automatically referred to security for SECURITY_AUTO status', () => {
    formService.referToSecurityIfRiskAssessed.mockResolvedValue('SECURITY_AUTO')
    const today = moment().format('DD/MM/YYYY')
    const todayISO = moment().format('YYYY-MM-DD')
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({ referred_date: `${todayISO}` })
    formService.getCategorisationRecord.mockResolvedValue({ status: 'SECURITY_AUTO', referred_date: `${todayISO}` })

    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Categorisation task list')
        expect(res.text).toContain(`Automatically referred to Security (${today})`)
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledTimes(1)
      })
  })

  test('should not display referred to security for other status', () => {
    formService.referToSecurityIfRiskAssessed.mockResolvedValue('STARTED')

    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Categorisation task list')
        expect(res.text).not.toContain(`Automatically referred to Security`)
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledTimes(1)
      })
  })

  test('should render categoriserSubmitted page', () =>
    request(app)
      .get('/categoriserSubmitted/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Submitted for approval')
      }))
})
