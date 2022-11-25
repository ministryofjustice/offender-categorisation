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
  createOrUpdateCategorisation: jest.fn(),
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
  jest.resetAllMocks()
})

describe('open conditions', () => {
  test.each`
    path                     | expectedContent
    ${'earliestReleaseDate'} | ${'Earliest release date'}
    ${'previousSentences'}   | ${'Previous sentences'}
    ${'victimContactScheme'} | ${'Victim Contact Scheme'}
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
      catType: 'INITIAL',
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
      catType: 'INITIAL',
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

  test('furtherCharges neither exists, INITIAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {},
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(302)
      .expect('Location', `/form/openConditions/riskLevels/12345`)
  })

  test('furtherCharges neither exists, RECAT', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {},
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Further charges')
        expect(res.text).toContain('></textarea>') // textarea is empty
      })
  })

  test.each`
    formName                 | userInput                                                                                     | updateInfo                                             | nextPath
    ${'earliestReleaseDate'} | ${{ catType: 'RECAT', threeOrMoreYears: 'No', justify: 'Yes', justifyText: 'text' }}          | ${{ catType: 'RECAT', threeOrMoreYears: 'No' }}        | ${'/form/openConditions/victimContactScheme/'}
    ${'earliestReleaseDate'} | ${{ catType: 'INITIAL', threeOrMoreYears: 'No', justify: 'Yes', justifyText: 'text' }}        | ${{ catType: 'INITIAL', threeOrMoreYears: 'No' }}      | ${'/form/openConditions/previousSentences/'}
    ${'victimContactScheme'} | ${{ catType: 'RECAT', vcsOptedFor: 'No' }}                                                    | ${{ catType: 'RECAT', vcsOptedFor: 'No' }}             | ${'/form/openConditions/foreignNational/'}
    ${'previousSentences'}   | ${{ catType: 'INITIAL', releasedLastFiveYears: 'No', sevenOrMoreYears: 'No' }}                | ${{ catType: 'INITIAL', releasedLastFiveYears: 'No' }} | ${'/form/openConditions/victimContactScheme/'}
    ${'victimContactScheme'} | ${{ catType: 'INITIAL', vcsOptedFor: 'No' }}                                                  | ${{ catType: 'INITIAL', vcsOptedFor: 'No' }}           | ${'/form/openConditions/sexualOffences/'}
    ${'foreignNational'}     | ${{ isForeignNational: 'No', dueDeported: 'Yes', formCompleted: 'Yes', exhaustedAppeal: '' }} | ${{ isForeignNational: 'No' }}                         | ${'/form/openConditions/riskOfHarm/'}
    ${'riskOfHarm'}          | ${{ seriousHarm: 'No', harmManaged: 'Yes', harmManagedText: '' }}                             | ${{ seriousHarm: 'No' }}                               | ${'/form/openConditions/furtherCharges/'}
    ${'furtherCharges'}      | ${{}}                                                                                         | ${{}}                                                  | ${'/form/openConditions/riskLevels/'}
    ${'riskLevels'}          | ${{ catType: 'INITIAL' }}                                                                     | ${{ catType: 'INITIAL' }}                              | ${'/tasklist/'}
    ${'riskLevels'}          | ${{ catType: 'RECAT' }}                                                                       | ${{ catType: 'RECAT' }}                                | ${'/tasklistRecat/'}
  `('Post $formName should go to $nextPath', ({ formName, userInput, updateInfo, nextPath }) => {
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
          userInput: updateInfo,
          formSection: 'openConditions',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test.each`
    formName                 | userInput
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'Yes', justify: 'No' }}
    ${'previousSentences'}   | ${{ releasedLastFiveYears: 'Yes', sevenOrMoreYears: 'Yes' }}
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
    data                                                                                                       | expectedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'No' } } }}                                               | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'Yes' } } }}                                        | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'Yes' } } }}                                          | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'No' } } }} | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open conditions'}
  `('should render notRecommended page with expected content: $expectedContent', ({ data, expectedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
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

  test.each`
    data                                                                                                        | notRecommendedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'Yes' } } }}                                               | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'No' } } }}                                          | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'No' } } }}                                            | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'Yes' } } }} | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'No' } } }}                              | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open'}
  `('notRecommended page should not contain content: $notRecommendedContent', ({ data, notRecommendedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: data,
    })
    return request(app)
      .get(`/notRecommended/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(notRecommendedContent)
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
