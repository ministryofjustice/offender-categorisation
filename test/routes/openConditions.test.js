const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')
const security = require('../../server/config/security')
const openConditions = require('../../server/config/openConditions')

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
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
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
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  formService.referToSecurityIfRiskAssessed.mockReset()
  formService.referToSecurityIfRequested.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  formService.update.mockReset()
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
      form_response: {
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
      form_response: {
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
      form_response: {
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
      form_response: {},
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(302)
      .expect('Location', `/form/openConditions/riskLevels/12345`)
  })

  test.each`
    formName                  | userInput                     | nextPath
    ${'earliestReleaseDate'}  | ${{ threeOrMoreYears: 'No' }} | ${'/form/openConditions/foreignNational/'}
    ${'foreignNational'}      | ${{ day: '12' }}              | ${'/form/openConditions/riskOfHarm/'}
    ${'riskOfHarm'}           | ${{ day: '12' }}              | ${'/form/openConditions/furtherCharges/'}
    ${'furtherCharges'}       | ${{ day: '12' }}              | ${'/form/openConditions/riskLevels/'}
    ${'riskLevels'}           | ${{ day: '12' }}              | ${'/form/openConditions/suitability/'}
    ${'suitability'}          | ${{ day: '12' }}              | ${'/form/openConditions/reviewOpenConditions/'}
    ${'reviewOpenConditions'} | ${{ day: '12' }}              | ${'/form/openConditions/provisionalCategory/'}
  `('should render $expectedContent for $sectionName/$formName', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      form_response: {},
    })
    request(app)
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
        })
      })
  })

  test.each`
    sectionName         | formName                 | userInput        | nextPath
    ${'openConditions'} | ${'provisionalCategory'} | ${{ day: '12' }} | ${'/tasklist/categoriserSubmitted/'}
  `(
    'should render $expectedContent for /openConditions/provisionalCategory',
    ({ sectionName, formName, userInput, nextPath }) =>
      request(app)
        .post(`/${formName}/12345`)
        .send(userInput)
        .expect(302)
        .expect('Location', `${nextPath}12345`)
        .expect(() => {
          expect(formService.update).toBeCalledTimes(1)
          expect(offendersService.getCatAInformation).toBeCalledTimes(0)
          expect(offendersService.createInitialCategorisation).toBeCalledWith('ABCDEF', '12345', userInput)
          expect(formService.update).toBeCalledWith({
            bookingId: 12345,
            userId: 'CA_USER_TEST',
            config: formConfig[sectionName][formName],
            userInput,
            formSection: 'categoriser', // persist the provisional categorisation against the categoriser section
            formName,
            status: 'AWAITING_APPROVAL',
          })
        })
  )

  test.each`
    formName                 | userInput                                     | expectedContent
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'Yes', justify: 'No' }} | ${'no special circumstances to warrant them moving into open conditions'}
    ${'foreignNational'}     | ${{ formCompleted: 'No' }}                    | ${'cannot be sent to open conditions without a CCD3 form'}
    ${'foreignNational'}     | ${{ exhaustedAppeal: 'Yes' }}                 | ${'they are due to be deported'}
  `('should render openConditionsNotSuitable page', ({ formName, userInput, expectedContent }) =>
    request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )

  test.each`
    data                                                                | expectedPage
    ${{ openConditions: { riskOfHarm: { harmManaged: 'No' } } }}        | ${'notRecommended'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'Yes' } } }} | ${'notRecommended'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'Yes' } } }}   | ${'notRecommended'}
    ${{ openConditions: {} }}                                           | ${'provisionalCategory'}
  `('should redirect from reviewOpenConditions page', ({ data, expectedPage }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      form_response: data,
    })
    return request(app)
      .post(`/reviewOpenConditions/12345`)
      .send({})
      .expect(302)
      .expect('Location', `/form/openConditions/${expectedPage}/12345`)
  })

  test.each`
    data                                                                | expectedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'No' } } }}        | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'Yes' } } }} | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'Yes' } } }}   | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
  `('should render notRecommended page', ({ data, expectedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      form_response: data,
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
      .send({ stillRefer: 'Yes' })
      .expect(302)
      .expect('Location', `/form/openConditions/provisionalCategory/12345`))

  test('should redirect from notRecommended page to categoriser', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']

    return request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'No' })
      .expect(302)
      .expect('Location', `/form/categoriser/provisionalCategory/12345`)
  })

  test('should redirect from notRecommended page to supervisor', () => {
    roles = ['ROLE_APPROVE_CATEGORISATION']

    return request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'No' })
      .expect(302)
      .expect('Location', `/form/supervisor/review/12345`)
  })
})
