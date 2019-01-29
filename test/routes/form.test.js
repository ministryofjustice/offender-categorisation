const request = require('supertest')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/form')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const pdConfig = require('../../server/config/personalDetails')
const tConfig = require('../../server/config/transport')
const aConfig = require('../../server/config/agile')
const rConfig = require('../../server/config/ratings')

const formConfig = {
  ...pdConfig,
  ...tConfig,
  ...aConfig,
  ...rConfig,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
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

const formRoute = createRouter({ formService, offendersService, userService, authenticationMiddleware })

let app

beforeEach(() => {
  app = appSetup(formRoute)
  formService.getCategorisationRecord.mockResolvedValue({})
  offendersService.getOffenderDetails.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  offendersService.getOffenderDetails.mockReset()
  formService.update.mockReset()
  userService.getUser.mockReset()
})

describe('GET /section/form', () => {
  test.each`
    path                                | expectedContent
    ${'ratings/offendingHistory/12345'} | ${'Offending history'}
    ${'personalDetails/name/12345'}     | ${'Full name'}
    ${'personalDetails/dob/12345'}      | ${'What is your date of birth?'}
    ${'personalDetails/address/12345'}  | ${'What is your address?'}
    ${'transport/commute/12345'}        | ${'How do you commute to work?'}
    ${'transport/car/12345'}            | ${'Do you own a car?'}
    ${'agile/experience/12345'}         | ${'Have you worked with agile methodologies before?'}
    ${'agile/opinion/12345'}            | ${'Can you provide your opinions on agile working?'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  )
})

describe('POST /section/form', () => {
  test.each`
    sectionName          | formName              | userInput                          | nextPath
    ${'ratings'}         | ${'offendingHistory'} | ${{ previousConvictions: 'prev' }} | ${'/tasklist/'}
    ${'personalDetails'} | ${'name'}             | ${{ fullName: 'Name' }}            | ${'/form/personalDetails/dob/'}
    ${'personalDetails'} | ${'dob'}              | ${{ day: '12' }}                   | ${'/form/personalDetails/address/'}
    ${'personalDetails'} | ${'address'}          | ${{ addressLine1: 'Something' }}   | ${'/tasklist/'}
    ${'transport'}       | ${'commute'}          | ${{ commuteVia: 'a' }}             | ${'/form/transport/car/'}
    ${'transport'}       | ${'car'}              | ${{ haveCar: 'no' }}               | ${'/tasklist/'}
    ${'agile'}           | ${'experience'}       | ${{ workedPreviously: 'No' }}      | ${'/tasklist/'}
    ${'agile'}           | ${'experience'}       | ${{ workedPreviously: 'Yes' }}     | ${'/form/agile/opinion'}
    ${'agile'}           | ${'opinion'}          | ${{ response: 'Stuff' }}           | ${'/tasklist/'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig[formName],
          userInput,
          formSection: sectionName,
          formName,
        })
      })
  )
})
