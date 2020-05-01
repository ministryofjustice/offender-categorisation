const moment = require('moment')
const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const mockContext = { user: { username: 'me', token: 'ABCDEF' } }

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
  approveLiteCategorisation: jest.fn(),
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
    formService.getCategorisationRecord.mockResolvedValue({})
    formService.getLiteCategorisation.mockResolvedValue({})
    const sixMonths = moment()
      .add(6, 'months')
      .format('DD/MM/YYYY')

    return request(app)
      .get(`/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other category assessment</h1>')
        expect(res.text).toContain('<option value="RECP">Reception</option>')
        expect(res.text).toContain('<option value="SECUR">Security</option>')
        expect(res.text).toContain(
          `<input class="govuk-input govuk-!-width-full" id="nextReviewDate" name="nextReviewDate" type="text" value="${sixMonths}">`
        )
        expect(res.text).toContain('<option value="SYI">Shrewsbury (HMP)</option>')
        expect(res.text).toContain('<option value="MDI">Moorland</option>')
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

describe('approve', () => {
  test('get form page', () => {
    formService.getLiteCategorisation.mockResolvedValue({
      bookingId: 12,
      assessedBy: 'categoriser',
      category: 'R',
      assessmentCommittee: 'GOV',
      displayCreatedDate: '01/01/2020',
      placementPrisonId: 'EYI',
      assessmentComment: 'comment text',
    })

    return request(app)
      .get(`/approve/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other category approval</h1>')
        expect(res.text).toContain('<div id="category" class="govuk-grid-column-one-third">R')
        expect(res.text).toContain('<div id="assessmentCommittee" class="govuk-grid-column-one-third">GOV')
        expect(res.text).toContain('<div id="displayCreatedDate" class="govuk-grid-column-one-third">01/01/2020')
        expect(res.text).toContain('<div id="assessedBy" class="govuk-grid-column-one-third">categoriser')
        expect(res.text).toContain('<div id="placementPrisonId" class="govuk-grid-column-one-third">EYI')
        expect(res.text).toContain('<div id="assessmentComment" class="govuk-grid-column-one-third">comment text')
      })
  })

  test('get form page - no pending categorisation', () => {
    formService.getLiteCategorisation.mockResolvedValue({})

    return request(app)
      .get(`/approve/12`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Other category approval</h1>')
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
        expect(res.text).toContain('Other category approval</h1>')
        expect(res.text).toContain('A categorisation cannot be approved by the same user.')
      })
  })

  test('Post form page', () => {
    const futureDate = moment()
      .add(5, 'months')
      .format('DD/MM/YYYY')
    const userInput = {
      approvedDate: '15/04/2020',
      supervisorCategory: 'E',
      approvedCategoryComment: 'approvedCategoryComment',
      approvedCommittee: 'SECUR',
      nextReviewDate: futureDate,
      approvedPlacement: 'BMI',
      approvedPlacementComment: 'approvedPlacementComment',
      approvedComment: 'approvedComment',
    }
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12, sequence: 4, assessedBy: 'me' })

    return request(app)
      .post(`/approve/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/liteCategories/confirmed/12345`)
      .expect(() => {
        expect(offendersService.approveLiteCategorisation).toBeCalledWith({
          context: mockContext,
          bookingId: 12345,
          sequence: 4,
          ...userInput,
          transactionalClient: mockTransactionalClient,
        })
      })
  })
})
