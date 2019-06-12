const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const categoriser = require('../../server/config/categoriser')
const recat = require('../../server/config/recat')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

let roles
// This needs mocking early, before 'requiring' jwt-decode (via home.js)
jest.doMock('jwt-decode', () => jest.fn(() => ({ authorities: roles })))

const createRouter = require('../../server/routes/recat')

const formConfig = {
  recat,
  categoriser,
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
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
  deleteFormData: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
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

const formRoute = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
})

let app

beforeEach(() => {
  app = appSetup(formRoute)
  roles = ['ROLE_CREATE_RECATEGORISATION']
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.isYoungOffender.mockReturnValue(false)
  formService.deleteFormData.mockReturnValue({})
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent' })
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  formService.referToSecurityIfRiskAssessed.mockReset()
  formService.referToSecurityIfRequested.mockReset()
  formService.update.mockReset()
  formService.getValidationErrors.mockReset()
  formService.computeSuggestedCat.mockReset()
  formService.updateFormData.mockReset()
  formService.isYoungOffender.mockReset()
  formService.mergeRiskProfileData.mockReset()
  formService.backToCategoriser.mockReset()
  formService.isValid.mockReset()
  formService.deleteFormData.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  userService.getUser.mockReset()
})

describe('recat', () => {
  test.each`
    path                      | expectedContent
    ${'higherSecurityReview'} | ${'Higher Security Review'}
    ${'riskAssessment'}       | ${'Risk assessment'}
  `('Get should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )

  test.each`
    formName                  | userInput                  | nextPath
    ${'higherSecurityReview'} | ${{ transfer: 'No' }}      | ${'/tasklistRecat/'}
    ${'riskAssessment'}       | ${{ otherRelevant: 'No' }} | ${'/tasklistRecat/'}
  `('Post $formName should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
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
          config: formConfig.recat[formName],
          userInput,
          formSection: 'recat',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('Get category decision for offender 21 or over)', () => {
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).not.toContain('catIOption')
      })
  })

  test('Get category decision for offender under 21)', () => {
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('catIOption')
      })
  })
})

describe('POST /form/recat/decision', () => {
  test.each`
    formName      | userInput                                  | nextPath
    ${'decision'} | ${{ currentCategory: 'I', category: 'B' }} | ${'/form/recat/miniHigherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'I' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'C' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'B' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'C' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'B' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'C' }} | ${'/form/recat/higherSecurityReview/'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'C' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'D' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'J' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'I' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'D' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'C' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'B' }} | ${'/tasklistRecat/'}
    ${'decision'} | ${{ currentCategory: 'C', category: 'C' }} | ${'/tasklistRecat/'}
  `('Post for input $userInput should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
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
          config: formConfig.recat[formName],
          userInput,
          formSection: 'recat',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })
})
