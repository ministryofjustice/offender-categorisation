const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/tasklist')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const moment = require('moment')
const db = require('../../server/data/dataAccess/db')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

const formService = {
  getCategorisationRecord: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  createOrRetrieveCategorisationRecord: jest.fn(),
  updateFormData: jest.fn(),
  mergeRiskProfileData: jest.fn(),
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
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
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
    const today = moment().format('DD/MM/YYYY')
    const todayISO = moment().format('YYYY-MM-DD')
    offendersService.getOffenderDetails.mockResolvedValue({ bookingId: 12345, displayName: 'Claire Dent' })
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_AUTO',
      securityReferredDate: `${todayISO}`,
    })
    const sampleSocProfile = {
      transferToSecurity: true,
      provisionalCategorisation: 'B',
    }
    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      securityReferredDate: `${todayISO}`,
      formObject: { sample: 'string', socProfile: sampleSocProfile },
      status: 'SECURITY_AUTO',
    })

    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Categorisation task list')
        expect(res.text).toContain(`Automatically referred to Security (${today})`)
        expect(res.text).toContain('href="/form/ratings/offendingHistory/12345"')

        expect(formService.mergeRiskProfileData).toBeCalledWith(
          '12345',
          {
            socProfile: sampleSocProfile,
          },
          mockTransactionalClient
        )
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledWith(
          '12345',
          'CA_USER_TEST',
          sampleSocProfile,
          'STARTED',
          mockTransactionalClient
        )
        expect(formService.updateFormData).not.toBeCalled()
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
