const moment = require('moment')
const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const mockContext = { user: { token: 'ABCDEF' } }

const createRouter = require('../../server/routes/liteCategories')

const formService = {
  getCategorisationRecord: jest.fn(),
  getLiteCategorisation: jest.fn(),
  recordLiteCategorisation: jest.fn(),
}

const offendersService = {
  getBasicOffenderDetails: jest.fn(),
  getAgencies: jest.fn(),
  createLiteCategorisation: jest.fn(),
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
  offendersService.getBasicOffenderDetails.mockResolvedValue({
    bookingId: 12,
    agencyId: 'BXI',
    offenderNo: 'A1000EE',
  })
  userService.getUser.mockResolvedValue({})
  offendersService.getAgencies.mockResolvedValue([
    { agencyId: 'SYI', description: 'SHREWSBURY (HMP)' },
    { agencyId: 'MDI', description: 'MOORLAND' },
  ])
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('assessment', () => {
  test('get form page', () => {
    formService.getLiteCategorisation.mockResolvedValue({})
    return request(app)
      .get(`/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        // expect(res.text).toMatch(/Home.+Categorisation home.+Category review task list.+Next review date/s)
        expect(res.text).toContain('Other category assessment</h1>')
      })
  })

  test('Post form page', () => {
    const futureDate = moment()
      .add(5, 'months')
      .format('DD/MM/YYYY')
    const userInput = {
      category: 'R',
      authority: 'RECP',
      nextReviewDate: futureDate,
      placement: 'SYI',
      comment: 'some text',
    }
    return request(app)
      .post(`/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/liteCategories/confirmed/12345`)
      .expect(() => {
        expect(offendersService.createLiteCategorisation).toBeCalledWith({
          context: mockContext,
          bookingId: 12345,
          ...userInput,
          offenderNo: 'A1000EE',
          prisonId: 'BXI',
          transactionalClient: mockTransactionalClient,
        })
      })
  })
})
