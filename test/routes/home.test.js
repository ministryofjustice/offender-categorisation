const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

let roles
// This needs mocking early, before 'requiring' jwt-decode
jest.doMock('jwt-decode', () => jest.fn(() => ({ authorities: roles })))

const createRouter = require('../../server/routes/home')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getCategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createOrUpdateCategorisation: jest.fn(),
  getUnapprovedOffenders: jest.fn(),
  getRecategoriseOffenders: jest.fn(),
  getReferredOffenders: jest.fn(),
  isRecat: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
  getUserByUserId: jest.fn(),
}

const statsService = {}

const formService = {
  createSecurityReferral: jest.fn(),
  getSecurityReferral: jest.fn(),
  getRiskChangeCount: jest.fn(),
  getCategorisationRecord: jest.fn(),
}

const homeRoute = createRouter({
  authenticationMiddleware,
  userService,
  offendersService,
  statsService,
  formService,
})

let app

beforeEach(() => {
  app = appSetup(homeRoute)
  offendersService.getOffenderDetails.mockResolvedValue({})
  offendersService.getCategorisedOffenders.mockResolvedValue({})
  offendersService.getUnapprovedOffenders.mockResolvedValue({})
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  offendersService.getRecategoriseOffenders.mockResolvedValue({})
  offendersService.getReferredOffenders.mockResolvedValue({})
  offendersService.getOptionalAssessmentAgencyDescription = jest.fn()
  formService.getRiskChangeCount.mockResolvedValue(0)
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.getSecurityReferral.mockResolvedValue({})
  userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI' })
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  offendersService.getCategorisedOffenders.mockReset()
  offendersService.getUncategorisedOffenders.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getUnapprovedOffenders.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  offendersService.getRecategoriseOffenders.mockReset()
  offendersService.getOptionalAssessmentAgencyDescription.mockReset()
  offendersService.getReferredOffenders.mockReset()
  formService.getRiskChangeCount.mockReset()
  userService.getUser.mockReset()
  userService.getUserByUserId.mockReset()
})

describe('GET /categoriserDone', () => {
  test('results', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        assessmentDate: '2017-03-27',
        approvalDate: '2019-02-21',
        assessmentSeq: 7,
        categoriserFirstName: 'JOHN',
        categoriserLastName: 'LAMB',
        approverFirstName: 'JAMES',
        approverLastName: 'HELLY',
        category: 'C',
      },
    ])
    return request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Tim Handle')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })

  test('no results', () =>
    request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('No categorised prisoners found')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      }))
})

describe('GET /supervisorHome', () => {
  test('results for categorisation outside of cat tool', () => {
    offendersService.getUnapprovedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        category: 'C',
        pnomis: true,
      },
    ])
    return request(app)
      .get('/supervisorHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('PNOMIS') // should not display start button
        expect(offendersService.getUnapprovedOffenders).toBeCalledTimes(1)
      })
  })
})

describe('GET /categoriserHome', () => {
  test('button is Start for Uncategorised records (no database record)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Not categorised',
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Start')
        expect(res.text).not.toContain('locked')
        expect(res.text).toMatch(/Home.+Categorisation home/s)
        expect(offendersService.getUncategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('button is view for awaiting approval records (with cat tool dbrecord)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Awaiting approval',
        dbRecordExists: true,
        assignedUserId: 'DC123',
        securityReferredBy: 'Mimsie Don',
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View') // should display view button
        expect(res.text).not.toContain('locked')
        expect(offendersService.getUncategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('button is edit for completed security records (with cat tool dbrecord)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Completed Security',
        dbRecordExists: true,
        assignedUserId: 'DC123',
        securityReferredBy: 'Mimsie Don',
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Edit') // should display view button
        expect(res.text).not.toContain('locked')
        expect(offendersService.getUncategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('button is edit for referred security records (with cat tool dbrecord)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Automatically referred to Security',
        dbRecordExists: true,
        assignedUserId: 'DC123',
        securityReferredBy: 'Mimsie Don',
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Edit') // should display view button
        expect(res.text).not.toContain('locked')
        expect(offendersService.getUncategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('button is replaced with PNOMIS for categorisations that have been progresses in PNOMIS (without a db record)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Any other status',
        pnomis: true,
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('PNOMIS') // no button
        expect(offendersService.getUncategorisedOffenders).toBeCalledTimes(1)
      })
  })
})

describe('GET /', () => {
  test('unauthorised user', () => {
    roles = ['ROLE_1', 'ROLE_2']
    return request(app)
      .get('/')
      .expect(403)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You are not authorised to use this application') // no button
      })
  })

  test('cat user', () => {
    roles = ['other_role', 'ROLE_CREATE_CATEGORISATION']
    return request(app)
      .get('/')
      .expect(302)
      .expect('location', '/categoriserHome')
  })

  test('supervisor user', () => {
    roles = ['ROLE_APPROVE_CATEGORISATION', 'other_role']
    return request(app)
      .get('/')
      .expect(302)
      .expect('location', '/supervisorHome')
  })

  test('security user', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    return request(app)
      .get('/')
      .expect(302)
      .expect('location', '/securityHome')
  })
})

describe('Recategoriser home', () => {
  test('total is displayed on Potential reviews tab)', () => {
    offendersService.getRecategoriseOffenders.mockResolvedValue([])
    formService.getRiskChangeCount.mockResolvedValue(4)
    return request(app)
      .get('/recategoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Home.+Categorisation home/s)
        expect(res.text).toMatch(/Potential reviews.*4<\/span.*/)
        expect(offendersService.getRecategoriseOffenders).toBeCalledTimes(1)
      })
  })
  test('total is not displayed on Potential reviews tab if equal to 0', () => {
    offendersService.getRecategoriseOffenders.mockResolvedValue([])
    formService.getRiskChangeCount.mockResolvedValue(4)
    return request(app)
      .get('/recategoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toMatch(/Potential reviews.*0<\/span.*/)
        expect(offendersService.getRecategoriseOffenders).toBeCalledTimes(1)
      })
  })
})

describe('security home', () => {
  const referred = [
    {
      id: 729,
      bookingId: 1186899,
      userId: 'LBENNETT_GEN',
      status: 'SECURITY_FLAGGED',
      assignedUserId: 'LBENNETT_GEN',
      securityReferredDate: '2019-11-04T15:46:48.779Z',
      securityReferredBy: 'Lucy Bennett',
      offenderNo: 'G9964UP',
      catType: 'INITIAL',
      prisonid: 'LPI',
      displayName: 'Paxtyn, Otsairah',
      catTypeDisplay: 'Initial',
    },
    {
      id: 522,
      bookingId: 999147,
      userId: 'LBENNETT_GEN',
      status: 'SECURITY_FLAGGED',
      assignedUserId: 'LBENNETT_GEN',
      securityReferredDate: '2019-10-21T13:03:56.494Z',
      securityReferredBy: 'Lucy Bennett',
      offenderNo: 'G0581UW',
      catType: 'RECAT',
      prisonid: 'LPI',
      displayName: 'Myrolph, Efltoche',
      daysSinceSentence: 1458,
      dateRequired: '23/11/2015',
      sentenceDate: '2015-11-08',
      catTypeDisplay: 'Recat',
    },
  ]
  test('handles offenders without sentences', () => {
    offendersService.getReferredOffenders.mockResolvedValue(referred)
    return request(app)
      .get('/securityHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Home.+Categorisation home/s)
        expect(res.text).toMatch(/G9964UP.+G0581UW/s)
        expect(offendersService.getReferredOffenders).toBeCalledTimes(1)
      })
  })
})

describe('Landing page', () => {
  test('security user get', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.isRecat.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({})

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Dexter Spaniel')
        expect(res.text).toContain('securityButton')
        expect(res.text).toMatch(/<a href="http.+\/offenders\/B2345XY\/quick-look" class="govuk-back-link">Back<\/a>/)
        expect(res.text).toMatch(/Home.+Categorisation home.+Manage categorisations/s)
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(0)
        expect(offendersService.isRecat).toBeCalledTimes(1)
      })
  })

  test('security user get - referred by current user', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userService.getUser.mockResolvedValue({
      username: 'CT_SEC',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.isRecat.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'LEI',
      userId: 'CT_SEC',
      status: 'NEW',
      raisedDate: '2019-10-17T11:34:35.740Z',
    })

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Dexter Spaniel')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(0)
      })
  })

  test('security user get - categorisation in progress', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12,
      formObject: {},
      userId: 'A_BEN',
    })
    userService.getUser.mockResolvedValue({
      username: 'CT_SEC',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
    })
    userService.getUserByUserId.mockResolvedValue({
      username: 'A_BEN',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
      displayNameAlternative: 'Amy Ben',
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.isRecat.mockResolvedValue('INITIAL')

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`This prisoner's categorisation review is already in progress with Amy Ben`)
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(1) // retrieves the categoriser name for display
      })
  })

  test('security user get - referred by another user from a different prison', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userService.getUser.mockResolvedValue({
      username: 'CT_SEC',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.isRecat.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'ANI',
      userId: 'ANOTHER',
      status: 'NEW',
      raisedDate: '2019-10-17T11:34:35.740Z',
    })
    userService.getUserByUserId.mockResolvedValue({
      displayNameAlternative: 'James Brown',
      roles: { security: true },
    })
    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('Blackpool (HMP)')

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Referred by James Brown of Blackpool (HMP)')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledTimes(1)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledWith(expect.anything(), 'ANI')
        expect(userService.getUserByUserId).toBeCalledTimes(1)
      })
  })

  test('security user get - referred by another user from the same prison', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userService.getUser.mockResolvedValue({
      username: 'CT_SEC',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.isRecat.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'LEI',
      userId: 'ANOTHER',
      status: 'NEW',
      raisedDate: '2019-10-17T11:34:35.740Z',
    })
    userService.getUserByUserId.mockResolvedValue({
      displayNameAlternative: 'James Brown',
      activeCaseLoad: {
        caseLoadId: 'LEI',
        description: 'Leeds (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
      roles: { security: true },
    })

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Referred by James Brown of Leeds (HMP)')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledTimes(0)
        expect(userService.getUserByUserId).toBeCalledTimes(1)
      })
  })

  test('security user post', () => {
    userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({ offenderNo: 'B2345XY', bookingId: 12 })
    return request(app)
      .post('/securityLanding/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Automatic referral setup successful')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(formService.createSecurityReferral).toBeCalledTimes(1)
      })
  })
})
