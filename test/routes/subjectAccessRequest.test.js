const request = require('supertest')
const appSetup = require('./utils/appSetup')

const createRouter = require('../../server/routes/subjectAccessRequest')
const { authenticationMiddleware } = require('./utils/mockAuthentication')

describe('subjectAccessRequest router', () => {
  let app
  let mockSubjectAccessRequestService

  beforeEach(() => {
    mockSubjectAccessRequestService = jest.fn()

    const subjectAccessRequestRoute = createRouter({
      authenticationMiddleware,
      subjectAccessRequestService: mockSubjectAccessRequestService,
    })

    app = appSetup(subjectAccessRequestRoute)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // it('should 200', () => {
  //   return request(app)
  //     .get('/subject-access-request')
  //     .expect(409)
  //     .expect('Content-Type', /html/)
  //     .expect(res => {
  //       expect(res.text).toContain('Tim Handle')
  //       expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
  //     })
  // })
  //
  // it('should 204', () => {
  //   return request(app)
  //     .get('/subject-access-request')
  //     .expect(409)
  //     .expect('Content-Type', /html/)
  //     .expect(res => {
  //       expect(res.text).toContain('Tim Handle')
  //       expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
  //     })
  // })

  describe('Subject Identifier is not recognised by this service - 209', () => {
    it('should gracefully handle any CRN-only requests', () => {
      return request(app)
        .get('/?crn=anything')
        .expect(209)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual([])
        })
    })
  })

  describe('IncorrectRequest - 400 error', () => {
    it('should require a PRN and / or CRN', () => {
      return request(app)
        .get('/')
        .expect(400)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            developerMessage:
              'Either NOMIS Prison Number (PRN) or nDelius Case Reference Number (CRN) must be provided as part of the request.',
            errorCode: 400,
            status: 400,
            userMessage:
              'Either NOMIS Prison Number (PRN) or nDelius Case Reference Number (CRN) must be provided as part of the request.',
          })
        })
    })
  })

  //
  // it('should 401', () => {
  //   return request(app)
  //     .get('/subject-access-request')
  //     .expect(409)
  //     .expect('Content-Type', /html/)
  //     .expect(res => {
  //       expect(res.text).toContain('Tim Handle')
  //       expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
  //     })
  // })
})
