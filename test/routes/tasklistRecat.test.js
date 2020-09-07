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
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)

  moment.now = jest.fn()
  moment.now.mockReturnValue(moment('2019-05-31', 'YYYY-MM-DD'))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /tasklistRecat/', () => {
  test('should render Recat tasklist', () =>
    request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Home.+Categorisation home.+Category review task list/s)
        expect(res.text).toContain('Category review task list')
        expect(res.text).toContain('Security information')
        expect(res.text).toContain('Not yet checked')
        expect(formService.updateStatusForOutstandingRiskChange).toBeCalledWith({
          offenderNo: 'GN123',
          userId: 'CA_USER_TEST',
          status: 'REVIEWED_FIRST',
          transactionalClient: mockTransactionalClient,
        })
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
        expect(res.text).toContain('Category review task list')
        expect(res.text).toContain(`Automatically referred to Security (${today})`)
        expect(res.text).toContain('href="/form/recat/riskAssessment/12345"')

        expect(formService.mergeRiskProfileData).toBeCalledWith(
          '12345',
          { socProfile: sampleSocProfile },
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
        expect(res.text).toContain('Category review task list')
        expect(res.text).not.toContain(`Automatically referred to Security`)
        expect(res.text).toContain('Not yet checked')
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

describe('GET /tasklistRecat/ Fast track C item', () => {
  const sampleSocProfile = {
    transferToSecurity: false,
    provisionalCategorisation: 'C',
  }
  test('should hide fast track task for offender currently category B', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      sentence: {
        bookingId: 12345,
        confirmedReleaseDate: '2022-06-01',
        sentenceExpiryDate: '2020-06-17',
      },
      categoryCode: 'B',
    })
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })
    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string', socProfile: sampleSocProfile },
      status: 'STARTED',
    })
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Category C preliminary review questions')
      })
  })

  test('should hide fast track task for offender with a SECURITY related status', () => {
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })

    const sampleSocProfileAuto = {
      transferToSecurity: true,
      provisionalCategorisation: 'B',
    }
    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfileAuto)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string', socProfile: sampleSocProfile },
      status: 'SECURITY_AUTO',
    })
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Category C preliminary review questions')
      })
  })

  test('should hide fast track task for offender with 3 or less years until confirmed release date', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'GN123',
      sentence: {
        bookingId: 12345,
        confirmedReleaseDate: '2022-05-31',
        sentenceExpiryDate: '2020-06-17',
      },
      categoryCode: 'C',
    })
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })

    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string', socProfile: sampleSocProfile },
      status: 'STARTED',
    })

    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Category C preliminary review questions')
      })
  })

  test('should display fast track task for eligible offender', () => {
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })

    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string', socProfile: sampleSocProfile },
      status: 'STARTED',
      bookingId: 1234567,
    })
    return request(app)
      .get('/1234567')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category C preliminary review questions')
      })
  })

  test('should hide fast track task for a cancelled fast track', () => {
    formService.createOrRetrieveCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: { sample: 'string' },
      status: 'STARTED',
    })

    riskProfilerService.getSecurityProfile.mockResolvedValue(sampleSocProfile)
    formService.getCategorisationRecord.mockResolvedValue({
      id: 1111,
      formObject: {
        sample: 'string',
        socProfile: sampleSocProfile,
        recat: {
          nextReviewDate: { date: '10/06/2020' },
          fasttrackEligibility: {
            earlyCatD: 'No',
            increaseCategory: 'Yes',
          },
        },
      },
      status: 'STARTED',
    })
    return request(app)
      .get('/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Category C preliminary review questions')
      })
  })
})
