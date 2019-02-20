const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/form')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
}

const riskProfilerService = {
  getSecurityProfile: jest.fn(),
  getViolenceProfile: jest.fn(),
  getEscapeProfile: jest.fn(),
  getExtremismProfile: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCategoryHistory: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const formRoute = createRouter({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  authenticationMiddleware,
})

let app

beforeEach(() => {
  app = appSetup(formRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  offendersService.getOffenderDetails.mockResolvedValue({})
  offendersService.getCategoryHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
  riskProfilerService.getSecurityProfile.mockResolvedValue({})
  riskProfilerService.getViolenceProfile.mockResolvedValue({})
  riskProfilerService.getExtremismProfile.mockResolvedValue({})
  riskProfilerService.getEscapeProfile.mockResolvedValue({})
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  formService.referToSecurityIfRiskAssessed.mockReset()
  formService.referToSecurityIfRequested.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCategoryHistory.mockReset()
  formService.update.mockReset()
  userService.getUser.mockReset()
  riskProfilerService.getSecurityProfile.mockReset()
  riskProfilerService.getViolenceProfile.mockReset()
  riskProfilerService.getExtremismProfile.mockReset()
  riskProfilerService.getEscapeProfile.mockReset()
})

describe('GET /section/form', () => {
  test.each`
    path                                       | expectedContent
    ${'categoriser/review/12345'}              | ${'Check your answers before you continue'}
    ${'categoriser/provisionalCategory/12345'} | ${'Provisional category'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCategoryHistory).toBeCalledTimes(0)
      })
  )
})

describe('GET /ratings/offendingHistory', () => {
  test.each`
    path                                | expectedContent
    ${'ratings/offendingHistory/12345'} | ${'Offending history'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCategoryHistory).toBeCalledTimes(1)
      })
  )
})

describe('GET /ratings/securityInput', () => {
  test.each`
    path                             | expectedContent
    ${'ratings/securityInput/12345'} | ${'Security input'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCategoryHistory).toBeCalledTimes(0)
        expect(riskProfilerService.getSecurityProfile).toBeCalledTimes(1)
      })
  )
})

describe('GET /ratings/violence', () => {
  test.each`
    path                              | expectedContent
    ${'ratings/violenceRating/12345'} | ${'Violence rating'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(riskProfilerService.getViolenceProfile).toBeCalledTimes(1)
      })
  )
})

describe('GET /ratings/extremism', () => {
  test.each`
    path                               | expectedContent
    ${'ratings/extremismRating/12345'} | ${'Extremism rating'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(riskProfilerService.getExtremismProfile).toBeCalledTimes(1)
      })
  )
})

describe('POST /section/form', () => {
  test.each`
    sectionName     | formName              | userInput               | nextPath
    ${'ratings'}    | ${'securityInput'}    | ${{ fullName: 'Name' }} | ${'/tasklist/'}
    ${'ratings'}    | ${'violenceRating'}   | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'}    | ${'escapeRating'}     | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'}    | ${'extremismRating'}  | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'}    | ${'offendingHistory'} | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'supervisor'} | ${'review'}           | ${{ day: '12' }}        | ${'/tasklist/supervisor/outcome/'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(offendersService.getCategoryHistory).toBeCalledTimes(0)
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig[sectionName][formName],
          userInput,
          formSection: sectionName,
          formName,
        })
      })
  )
})
