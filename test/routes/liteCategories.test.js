const moment = require('moment')
const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')
const { makeTestFeatureFlagDto } = require('../../server/middleware/featureFlag.test-factory')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const mockContext = {
  featureFlags: makeTestFeatureFlagDto(),
  user: { username: 'me', token: 'ABCDEF' },
}

const createRouter = require('../../server/routes/liteCategories')

const formService = {
  getCategorisationRecord: jest.fn(),
  getLiteCategorisation: jest.fn(),
  recordLiteCategorisation: jest.fn(),
  deleteLiteCategorisation: jest.fn(),
}

const offendersService = {
  getOffenderDetails: jest.fn(),
  getAgencies: jest.fn(),
  createLiteCategorisation: jest.fn(),
  approveLiteCategorisation: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
  getUserByUserId: jest.fn(),
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
  offendersService.getOffenderDetails.mockResolvedValue({
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
    formService.getCategorisationRecord.mockResolvedValue({})
    formService.getLiteCategorisation.mockResolvedValue({})
    return request(app)
      .get(`/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Change security category</h1>')
        expect(res.text).toContain('<option value="RECP">Reception</option>')
        expect(res.text).toContain('<option value="SECUR">Security</option>')
        expect(res.text).toContain('<option value="SYI">Shrewsbury (HMP)</option>')
        expect(res.text).toContain('<option value="MDI">Moorland</option>')

        expect(res.text).toMatch(/<input[^>]*id="nextReviewDateDay"[^>]*>/)
        expect(res.text).toMatch(/<input[^>]*id="nextReviewDateMonth"[^>]*>/)
        expect(res.text).toMatch(/<input[^>]*id="nextReviewDateYear"[^>]*>/)
      })
  })

  test('get form page - in progress lite', () => {
    formService.getCategorisationRecord.mockResolvedValue({})
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12 })
    return request(app)
      .get(`/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A categorisation is already in progress for this person.')
      })
  })

  test('get form page - in progress', () => {
    formService.getCategorisationRecord.mockResolvedValue({ status: 'AWAITING_APPROVAL' })
    formService.getLiteCategorisation.mockResolvedValue({})
    return request(app)
      .get(`/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A categorisation is already in progress for this person.')
      })
  })

  test('Post form page', () => {
    const futureDate = moment().add(5, 'months')

    const futureDateFormInput = {
      day: futureDate.date().toString(),
      month: (futureDate.month() + 1).toString(),
      year: futureDate.year().toString(),
    }

    const expectedDate = moment().add(5, 'months').format('D/M/YYYY')

    const userInput = {
      category: 'U',
      authority: 'RECP',
      nextReviewDate: futureDateFormInput,
      placement: 'SYI',
      comment: 'some text some text',
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
          nextReviewDate: expectedDate,
          offenderNo: 'A1000EE',
          prisonId: 'BXI',
          transactionalClient: mockTransactionalClient,
        })
      })
  })
})

describe('approve', () => {
  test('get form page', () => {
    formService.getLiteCategorisation.mockResolvedValue({
      bookingId: 12,
      assessedBy: 'categoriser',
      category: 'D',
      assessmentCommittee: 'GOV',
      displayCreatedDate: '01/01/2020',
      placementPrisonId: 'SYI',
      assessmentComment: 'comment text comment text',
    })
    userService.getUserByUserId.mockResolvedValue({ firstName: 'FRED', lastName: 'PERRY' })

    return request(app)
      .get(`/approve/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Approve security category</h1>')
        expect(res.text).toContain('Indeterminate Cat D')
        expect(res.text).toContain('Governor')
        expect(res.text).toContain('01/01/2020')
        expect(res.text).toContain('Fred Perry')
        expect(res.text).toContain('Shrewsbury (HMP)')
        expect(res.text).toContain('comment text')
      })
  })

  test('get form page - no pending categorisation', () => {
    formService.getLiteCategorisation.mockResolvedValue({})

    return request(app)
      .get(`/approve/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Approve security category</h1>')
        expect(res.text).toContain('this person does not have a pending categorisation.')
      })
  })

  test('get form page - same user', () => {
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12, assessedBy: 'me' })

    return request(app)
      .get(`/approve/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Approve security category</h1>')
        expect(res.text).toContain('A categorisation cannot be approved by the same user.')
      })
  })

  test('Post form page', () => {
    const futureDate = moment().add(5, 'months')
    const userInput = {
      approvedDate: { day: '15', month: '04', year: '2020' },
      supervisorCategory: 'E',
      approvedCommittee: 'SECUR',
      approvedNextReviewDate: {
        day: futureDate.date().toString(),
        month: (futureDate.month() + 1).toString(),
        year: futureDate.year().toString(),
      },
      approvedPlacement: 'MDI',
      approvedComment: 'approvedComment',
    }
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12, sequence: 4, assessedBy: 'me' })

    return request(app)
      .post(`/approve/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/liteCategories/confirmed/12345`)
      .expect(() => {
        userInput.approvedDate = '15/4/2020'
        userInput.nextReviewDate = futureDate.format('D/M/YYYY')
        delete userInput.approvedNextReviewDate
        expect(offendersService.approveLiteCategorisation).toBeCalledWith({
          context: mockContext,
          bookingId: 12345,
          sequence: 4,
          ...userInput,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('Post form page - categorisation not found on nomis will redirect to /alreadyApproved', () => {
    const futureDate = moment().add(5, 'months')
    const userInput = {
      approvedDate: { day: '15', month: '4', year: '2020' },
      supervisorCategory: 'E',
      approvedCommittee: 'SECUR',
      approvedNextReviewDate: {
        day: futureDate.date().toString(),
        month: (futureDate.month() + 1).toString(),
        year: futureDate.year().toString(),
      },
      approvedPlacement: 'MDI',
      approvedComment: 'approvedComment',
    }
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12, sequence: 4, assessedBy: 'me' })
    offendersService.approveLiteCategorisation.mockImplementation(() => {
      const error = {
        status: 400,
        data: {
          developerMessage: '400 No pending category assessment found, E, booking 12345, seq 4',
          status: 400,
          userMessage: 'No pending category assessment found, category E, booking 12345, seq 4',
        },
      }
      throw error
    })

    return request(app)
      .post(`/approve/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/liteCategories/alreadyApproved/12345`)
      .expect(() => {
        expect(formService.deleteLiteCategorisation).toBeCalledWith('12345', 4, mockTransactionalClient)
      })
  })
})

describe('alreadyApproved', () => {
  test('get alreadyApproved', () => {
    userService.getUserByUserId.mockResolvedValue({ firstName: 'FRED', lastName: 'PERRY' })

    return request(app)
      .get(`/alreadyApproved/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`Categorisation has already been approved`)
        expect(res.text).toContain(
          `This categorisation has already been approved manually on P-Nomis. It will be visible on the <a href="/categoryHistory/12">prisoners categorisation history</a>`,
        )
        expect(res.text).toContain(`Finish`)
        expect(res.text).toContain(`<a href="/12">Manage prisoner</a>`)
      })
  })
})
