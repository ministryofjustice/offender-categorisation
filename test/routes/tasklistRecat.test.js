const request = require('supertest')
const moment = require('moment')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/tasklistRecat')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
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
  referToSecurityIfFlagged: jest.fn(),
  updateStatusForOutstandingRiskChange: jest.fn(),
  addSocProfile: jest.fn(),
  getLiteCategorisation: jest.fn(),
}

const riskProfilerService = {
  getSecurityProfile: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const pathfinderService = {
  getExtremismProfile: jest.fn(),
}

const tasklistRoute = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
  riskProfilerService,
  pathfinderService,
})

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.createOrRetrieveCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.updateStatusForOutstandingRiskChange.mockResolvedValue({})
  formService.getLiteCategorisation.mockResolvedValue({})
  offendersService.getOffenderDetails.mockResolvedValue({
    offenderNo: 'GN123',
    sentence: {
      bookingId: 12345,
      releaseDate: '2019-01-01',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      automaticReleaseDate: '2020-06-11',
      conditionalReleaseDate: '2020-02-02',
      confirmedReleaseDate: '2022-06-01',
      paroleEligibilityDate: '2020-06-13',
      nonParoleDate: '2020-06-14',
      tariffDate: '2020-06-15',
      licenceExpiryDate: '2020-06-16',
      sentenceExpiryDate: '2020-06-17',
    },
    categoryCode: 'C',
  })
  userService.getUser.mockResolvedValue({
    activeCaseLoad: {
      caseLoadId: 'MDI',
      description: 'Moorland (HMP & YOI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: true,
      female: false,
    },
  })
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)

  moment.now = jest.fn()
  moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /tasklistRecat/', () => {
  test('should render Recat tasklist for male prison', () =>
    request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain('Complete a categorisation review')
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('Previous risk assessments')
        expect(res.text).toContain('Security information')
        expect(res.text).toContain('Risk assessment')
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('Set next category review date')
        expect(res.text).toContain('Check and submit')
        expect(res.text).toContain('Not yet started')
        expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
          offenderNo: 'GN123',
          userId: 'CA_USER_TEST',
          status: 'REVIEWED_FIRST',
          transactionalClient: mockTransactionalClient,
        })
      }))

  test('should render Recat tasklist for female prison', () => {
    userService.getUser.mockResolvedValue({
      activeCaseLoad: {
        caseLoadId: 'PFI',
        description: 'Peterborough Female HMP',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        female: true,
      },
    })
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain('Complete a categorisation review')
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('Previous risk assessments')
        expect(res.text).toContain('Security information')
        expect(res.text).toContain('Risk assessment')
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('Set next category review date')
        expect(res.text).toContain('Check and submit')
        expect(res.text).toContain('Not yet started')
        expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
          offenderNo: 'GN123',
          userId: 'CA_USER_TEST',
          status: 'REVIEWED_FIRST',
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('should display automatically referred to security for SECURITY_AUTO status', () => {
    const today = moment().format('DD/MM/YYYY')
    const todayISO = moment().format('YYYY-MM-DD')
    offendersService.getOffenderDetails.mockResolvedValue({ bookingId: 12345, displayName: 'Claire Dent' })
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })
    const sampleSocProfile = {
      transferToSecurity: true,
      provisionalCategorisation: 'B',
    }
    const sampleExtremismProfile = {
      provisionalCategorisation: 'B',
    }
    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    pathfinderService.getExtremismProfile.mockResolvedValue(sampleExtremismProfile)
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
        expect(res.text).toContain('Complete a categorisation review')
        expect(res.text).toContain(`Automatically referred to Security (${today})`)
        expect(res.text).toContain('href="/form/recat/riskAssessment/12345"')

        expect(formService.mergeRiskProfileData).toBeCalledWith(
          '12345',
          { socProfile: sampleSocProfile, extremismProfile: sampleExtremismProfile },
          mockTransactionalClient,
        )
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledWith(
          '12345',
          'CA_USER_TEST',
          sampleSocProfile,
          sampleExtremismProfile,
          'STARTED',
          mockTransactionalClient,
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
        expect(res.text).toContain('Complete a categorisation review')
        expect(res.text).not.toContain(`Automatically referred to Security`)
        expect(res.text).toContain('Not yet started')
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledTimes(1)
      })
  })

  test('should render recategoriserSubmitted page', () =>
    request(app)
      .get('/recategoriserSubmitted/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Submitted for approval')
      }))
})
