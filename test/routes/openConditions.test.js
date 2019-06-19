const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')
const security = require('../../server/config/security')
const openConditions = require('../../server/config/openConditions')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

let roles
// This needs mocking early, before 'requiring' jwt-decode (via home.js)
jest.doMock('jwt-decode', () => jest.fn(() => ({ authorities: roles })))

const createRouter = require('../../server/routes/openConditions')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
  security,
  openConditions,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  computeSuggestedCat: jest.fn().mockReturnValue('B'),
  updateFormData: jest.fn(),
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
  cancelOpenConditions: jest.fn(),
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
  roles = ['ROLE_CREATE_CATEGORISATION']
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
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
  formService.mergeRiskProfileData.mockReset()
  formService.backToCategoriser.mockReset()
  formService.isValid.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  userService.getUser.mockReset()
})

describe('open conditions', () => {
  test.each`
    path                     | expectedContent
    ${'earliestReleaseDate'} | ${'Earliest release date'}
    ${'foreignNational'}     | ${'Foreign national'}
    ${'riskOfHarm'}          | ${'Risk of Serious Harm'}
    ${'riskLevels'}          | ${'Risk levels'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )

  test('furtherCharges both exist', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'old stuff' } },
        openConditions: { furtherCharges: { furtherChargesText: 'new stuff' } },
      },
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('new stuff')
      })
  })

  test('furtherCharges previous Charges exist', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'old stuff' } },
      },
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('old stuff')
      })
  })

  test('furtherCharges furtherChargesText exist', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: { furtherCharges: { furtherChargesText: 'new stuff' } },
      },
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('new stuff')
      })
  })

  test('furtherCharges neither exists', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {},
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(302)
      .expect('Location', `/form/openConditions/riskLevels/12345`)
  })

  test.each`
    formName                 | userInput                     | nextPath
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'No' }} | ${'/form/openConditions/foreignNational/'}
    ${'foreignNational'}     | ${{}}                         | ${'/form/openConditions/riskOfHarm/'}
    ${'riskOfHarm'}          | ${{}}                         | ${'/form/openConditions/furtherCharges/'}
    ${'furtherCharges'}      | ${{}}                         | ${'/form/openConditions/riskLevels/'}
    ${'riskLevels'}          | ${{ catType: 'INITIAL' }}     | ${'/tasklist/'}
    ${'riskLevels'}          | ${{ catType: 'RECAT' }}       | ${'/tasklistRecat/'}
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
          config: formConfig.openConditions[formName],
          userInput,
          formSection: 'openConditions',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test.each`
    formName                 | userInput
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'Yes', justify: 'No' }}
    ${'foreignNational'}     | ${{ formCompleted: 'No' }}
    ${'foreignNational'}     | ${{ exhaustedAppeal: 'Yes' }}
  `('should render openConditionsNotSuitable page for $formName', ({ formName, userInput }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: userInput,
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/form/openConditions/openConditionsNotSuitable/12345`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.openConditions[formName],
          userInput,
          formSection: 'openConditions',
          formName,
          transactionalClient: mockTransactionalClient,
        })
        expect(formService.cancelOpenConditions).toBeCalledWith(12345, 'CA_USER_TEST', mockTransactionalClient)
      })
  })

  test.each`
    data                                                                | expectedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'No' } } }}        | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'Yes' } } }} | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'Yes' } } }}   | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
  `('should render notRecommended page', ({ data, expectedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: data,
    })
    return request(app)
      .get(`/notRecommended/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  })

  test('should redirect from notRecommended page to provisionalCategory', () =>
    request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'Yes', catType: 'INITIAL' })
      .expect(302)
      .expect('Location', `/tasklist/12345`))

  test('should redirect from notRecommended page to categoriser', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: { categoriser: {} },
    })

    return request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'No', catType: 'RECAT' })
      .expect(302)
      .expect('Location', `/tasklistRecat/12345`)
  })
})
