const request = require('supertest')
const appSetup = require('./routes/utils/appSetup')
const createRouter = require('../server/routes/liteCategories')
const db = require('../server/data/dataAccess/db')
const { authenticationMiddleware } = require('./routes/utils/mockAuthentication')

const formService = { getCategorisationRecord: jest.fn() }
const offendersService = { getOffenderDetails: jest.fn() }
const userService = { getUser: jest.fn() }

const router = createRouter({
  formService,
  offendersService,
  userService,
  authenticationMiddleware,
})

beforeEach(() => {
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue({ query: jest.fn(), release: jest.fn() })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 500', () => {
  it('should render content with stack in dev mode', () => {
    formService.getCategorisationRecord.mockImplementation(() => {
      const error = { status: 500, stack: 'Some error!' }
      throw error
    })

    return request(appSetup(router))
      .get(`/123`)
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Sorry, there is a problem with the service/)
        expect(res.text).not.toMatch(/Something went wrong at .*. The error has been logged. Please try again/)
      })
  })

  it('should render content without stack in production mode', () => {
    formService.getCategorisationRecord.mockImplementation(() => {
      const error = { status: 500, stack: 'Some error!' }
      throw error
    })

    return request(appSetup(router, true))
      .get(`/123`)
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Sorry, there is a problem with the service/)
        expect(res.text).not.toContain('Some error!')
      })
  })
})
