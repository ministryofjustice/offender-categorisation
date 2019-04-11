const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/openConditions')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')
const security = require('../../server/config/security')
const openConditions = require('../../server/config/openConditions')

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

describe('GET /form', () => {
  test.each`
    path                     | expectedContent
    ${'earliestReleaseDate'} | ${'Time until earliest release date'}
    ${'foreignNationals'}    | ${'Foreign Nationals'}
    ${'riskOfHarm'}          | ${'Risk of Serious Harm'}
    ${'riskLevels'}          | ${'Risk levels'}
    ${'suitability'}         | ${'Suitability for open conditions'}
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
        ratings: { offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'old stuff' } },
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

  test('furtherCharges previousConvictions exist', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      form_response: {
        ratings: { offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'old stuff' } },
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
})

describe('POST /form', () => {
  test.each`
    formName                 | userInput                     | nextPath
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'No' }} | ${'/form/openConditions/foreignNationals/'}
    ${'foreignNationals'}    | ${{ day: '12' }}              | ${'/form/openConditions/riskOfHarm/'}
    ${'riskOfHarm'}          | ${{ day: '12' }}              | ${'/form/openConditions/furtherCharges/'}
    ${'furtherCharges'}      | ${{ day: '12' }}              | ${'/form/openConditions/riskLevels/'}
    ${'riskLevels'}          | ${{ day: '12' }}              | ${'/form/openConditions/suitability/'}
    ${'suitability'}         | ${{ day: '12' }}              | ${'/form/openConditions/reviewOpenConditions/'}
  `('should render $expectedContent for $sectionName/$formName', ({ formName, userInput, nextPath }) =>
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
  )

  test.each`
    formName                 | userInput                                     | expectedContent
    ${'earliestReleaseDate'} | ${{ threeOrMoreYears: 'Yes', justify: 'No' }} | ${'no special circumstances to warrant them moving into open conditions'}
    ${'foreignNationals'}    | ${{ formCompleted: 'No' }}                    | ${'cannot be sent to open conditions without a CCD3 form'}
    ${'foreignNationals'}    | ${{ exhaustedAppeal: 'Yes' }}                 | ${'they are due to be deported'}
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
})
