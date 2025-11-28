const request = require('supertest')
const moment = require('moment')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/tasklist')
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
  getLiteCategorisation: jest.fn(),
}

const alertService = {
  prisonerHasActiveOcgmAlert: jest.fn(),
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

const pathfinderService = {
  getExtremismProfile: jest.fn(),
}

const tasklistRoute = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
  alertService,
  pathfinderService,
})

let app

beforeEach(() => {
  app = appSetup(tasklistRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.createOrRetrieveCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.getLiteCategorisation.mockResolvedValue({})
  offendersService.getOffenderDetails.mockResolvedValue({
    offenderNo: 'GN123',
    sentence: {
      bookingId: 12345,
      releaseDate: '2019-01-01',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      automaticReleaseDate: '2020-06-11',
      conditionalReleaseDate: '2020-02-02',
      conditionalReleaseOverrideDate: '2020-04-04',
      paroleEligibilityDate: '2020-06-13',
      nonParoleDate: '2020-06-14',
      tariffDate: '2020-06-15',
      licenceExpiryDate: '2020-06-16',
      sentenceExpiryDate: '2020-06-17',
    },
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
})

afterEach(() => {
  jest.resetAllMocks()
  userService.getUser.mockReset()
})

describe('GET /tasklist/', () => {
  test('should render a tasklist for male prison', () => {
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain('Conditional Release Date')
        expect(res.text).toContain('04/04/2020')
        expect(res.text).toContain('Complete a categorisation')
        expect(res.text).toContain('Offending history')
        expect(res.text).toContain('Not yet started')
        expect(res.text).toContain('Further charges')
        expect(res.text).toContain('Safety and good order')
        expect(res.text).toContain('Risk of escape')
        expect(res.text).toContain('Extremism')
        expect(res.text).toContain('Security information')
        expect(res.text).not.toContain('Category decision')
        expect(res.text).toContain('Set next category review date')
        expect(res.text).toContain('Check and submit')
      })
  })

  test('should render a tasklist for female prison', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      prisonId: 'PFI',
      sentence: {
        bookingId: 12345,
        releaseDate: '2019-01-01',
        homeDetentionCurfewEligibilityDate: '2020-06-10',
        automaticReleaseDate: '2020-06-11',
        conditionalReleaseDate: '2020-02-02',
        conditionalReleaseOverrideDate: '2020-04-04',
        paroleEligibilityDate: '2020-06-13',
        nonParoleDate: '2020-06-14',
        tariffDate: '2020-06-15',
        licenceExpiryDate: '2020-06-16',
        sentenceExpiryDate: '2020-06-17',
      },
    })
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain('Conditional Release Date')
        expect(res.text).toContain('04/04/2020')
        expect(res.text).toContain('Complete a categorisation')
        expect(res.text).toContain('Offending history')
        expect(res.text).toContain('Not yet started')
        expect(res.text).not.toContain('Further charges')
        expect(res.text).toContain('Safety and good order')
        expect(res.text).toContain('Risk of escape')
        expect(res.text).toContain('Extremism')
        expect(res.text).toContain('Security information')
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('Set next category review date')
        expect(res.text).toContain('Check and submit')
      })
  })

  test('should display automatically referred to security for SECURITY_AUTO status', () => {
    const today = moment().format('DD/MM/YYYY')
    const todayISO = moment().format('YYYY-MM-DD')
    offendersService.getOffenderDetails.mockResolvedValue({
      bookingId: 12345,
      displayName: 'Claire Dent',
      agencyId: 'MDI',
    })
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_AUTO',
      securityReferredDate: `${todayISO}`,
    })
    const sampleExtremismProfile = {
      provisionalCategorisation: 'B',
    }
    alertService.prisonerHasActiveOcgmAlert.mockResolvedValue(true)
    pathfinderService.getExtremismProfile.mockResolvedValue(sampleExtremismProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      securityReferredDate: `${todayISO}`,
      formObject: { sample: 'string', socProfile: { transferToSecurity: true } },
      status: 'SECURITY_AUTO',
    })

    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Complete a categorisation')
        expect(res.text).toContain(`Automatically referred to Security (${today})`)
        expect(res.text).toContain('href="/form/ratings/offendingHistory/12345"')

        expect(formService.mergeRiskProfileData).toBeCalledWith(
          '12345',
          {
            socProfile: { transferToSecurity: true },
            extremismProfile: sampleExtremismProfile,
          },
          mockTransactionalClient,
        )
        expect(formService.referToSecurityIfRiskAssessed).toBeCalledWith(
          '12345',
          'CA_USER_TEST',
          { transferToSecurity: true },
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
        expect(res.text).toContain('Complete a categorisation')
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
