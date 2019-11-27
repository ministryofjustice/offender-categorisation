const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')
const nextReviewDate = require('../../server/config/nextReviewDate')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

const createRouter = require('../../server/routes/nextReviewDate')

const formConfig = {
  nextReviewDate,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  update: jest.fn(),
  isYoungOffender: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  computeSuggestedCat: jest.fn().mockReturnValue('B'),
  updateFormData: jest.fn(),
  setAwaitingApproval: jest.fn(),
  requiresOpenConditions: jest.fn(),
  cancelOpenConditions: jest.fn(),
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
  deleteFormData: jest.fn(),
  recordNomisSeqNumber: jest.fn(),
  categoriserDecision: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createOrUpdateCategorisation: jest.fn(),
  getPrisonerBackground: jest.fn(),
  getRiskChangeForOffender: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const formRoute = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
})

let app

beforeEach(() => {
  app = appSetup(formRoute)
  formService.getCategorisationRecord.mockResolvedValue({ status: 'STARTED', bookingId: 12345, formObject: {} })
  formService.isValid.mockResolvedValue(true)
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent' })
  userService.getUser.mockResolvedValue({})
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('recat', () => {
  test('next review date breadcrumb (in recat context)', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      formObject: { ratings: { nextReviewDate: { date: '25/11/2024' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      bookingId: 12,
    })
    return request(app)
      .get(`/nextReviewDateQuestion/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Home.+Categorisation home.+Category review task list.+Next review date/s)
        expect(res.text).toContain(
          '<a class="govuk-breadcrumbs__link" href="/tasklistRecat/12">Category review task list</a>'
        )
      })
  })

  test('next review date breadcrumb (in initial context)', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      formObject: { ratings: { nextReviewDate: { date: '25/11/2024' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      bookingId: 12,
    })
    return request(app)
      .get(`/nextReviewDateQuestion/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Home.+Categorisation home.+Categorisation task list.+Next review date/s)
      })
  })

  test('Post nextReviewDate should go to /tasklistRecat/', () => {
    const { formName, userInput, nextPath } = {
      formName: 'nextReviewDate',
      userInput: { date: '23/05/2025', catType: 'RECAT' },
      nextPath: '/tasklistRecat/',
    }
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: {},
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.nextReviewDate[formName],
          userInput,
          formSection: 'recat',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('Post nextReviewDate should go to /tasklist/', () => {
    const { formName, userInput, nextPath } = {
      formName: 'nextReviewDate',
      userInput: { date: '23/05/2024', catType: 'INITIAL' },
      nextPath: '/tasklist/',
    }
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: {},
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.nextReviewDate[formName],
          userInput,
          formSection: 'ratings',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })
})
