const request = require('supertest')
const moment = require('moment/moment')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')
const Status = require('../../server/utils/statusEnum').default

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
  requiredCatType: jest.fn(),
  getCategoryHistory: jest.fn(),
  getUpcomingReferredOffenders: jest.fn(),
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
  getLiteCategorisation: jest.fn(),
  isValid: jest.fn(),
  cancelSecurityReferral: jest.fn(),
  getNextReview: jest.fn(),
  isYoungOffender: jest.fn(),
}

const homeRoute = createRouter({
  authenticationMiddleware,
  userService,
  offendersService,
  statsService,
  formService,
})

const userServiceGetUser = () => {
  userService.getUser.mockResolvedValue({
    activeCaseLoad: {
      caseLoadId: 'MDI',
      description: 'Moorland (HMP & YOI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: true,
      female: false,
    },
    roles: { security: true },
  })
}

const offenderServiceGetOffenderDetails = () => {
  offendersService.getOffenderDetails.mockResolvedValue({
    offenderNo: 'B2345XY',
    bookingId: 12,
    displayName: 'Dexter Spaniel',
  })
}

const getMockedTprsValues = (cat, selected) => {
  return [
    {
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Tim Handle',
      category: cat,
      pnomis: true,
      dbRecord: {
        formObject: {
          openConditions: {
            tprs: {
              tprsSelected: selected,
            },
          },
        },
      },
    },
  ]
}

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
  formService.getCategorisationRecord.mockReset()
  formService.getSecurityReferral.mockReset()
  userService.getUser.mockReset()
  userService.getUserByUserId.mockReset()
  formService.createSecurityReferral.mockReset()
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

describe('TPRS label tests', () => {
  test('On supervisor home page TPRS label should not be displayed when tprs yes is selected and category is not open', () => {
    offendersService.getUnapprovedOffenders.mockResolvedValue(getMockedTprsValues('C', 'Yes'))
    return request(app)
      .get('/supervisorHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('TPRS')
        expect(offendersService.getUnapprovedOffenders).toBeCalledTimes(1)
      })
  })
  test('On supervisor home page TPRS label should be displayed when tprs yes is selected and category is open', () => {
    offendersService.getUnapprovedOffenders.mockResolvedValue(getMockedTprsValues('D', 'Yes'))
    return request(app)
      .get('/supervisorHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('TPRS')
        expect(offendersService.getUnapprovedOffenders).toBeCalledTimes(1)
      })
  })

  test('On supervisor done page TPRS label should not be displayed when tprs yes is selected and category is not open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('C', 'Yes'))
    return request(app)
      .get('/supervisorDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('On supervisor done page TPRS label should be displayed when tprs yes is selected and category is open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('D', 'Yes'))
    return request(app)
      .get('/supervisorDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })

  test('On categoriser done page TPRS label should not be displayed when tprs yes is selected and category is not open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('C', 'Yes'))
    return request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('On categoriser done page TPRS label should be displayed when tprs yes is selected and category is open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('D', 'Yes'))
    return request(app)
      .get('/categoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })

  test('On recategoriser done page TPRS label should not be displayed when tprs yes is selected and category is not open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('C', 'Yes'))
    return request(app)
      .get('/recategoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })
  test('On recategoriser done page TPRS label should be displayed when tprs yes is selected and category is open', () => {
    offendersService.getCategorisedOffenders.mockResolvedValue(getMockedTprsValues('D', 'Yes'))
    return request(app)
      .get('/recategoriserDone')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('TPRS')
        expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
      })
  })

  test('On category history page TPRS label should be displayed when tprs yes is selected and category is open', () => {
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          classificationCode: 'D',
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
        },
      ],
    })

    return request(app)
      .get('/categoryHistory/12')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('TPRS')
      })
  })

  test('On category history page TPRS label should NOT be displayed when tprs yes is selected and category is NOT open', () => {
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          classificationCode: 'C',
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
        },
      ],
    })

    return request(app)
      .get('/categoryHistory/12')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('TPRS')
        // expect(offendersService.getCategorisedOffenders).toBeCalledTimes(1)
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
        expect(res.text).toMatch(/Digital Prison Services/s)
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
  test('button is replaced with PNOMIS for categorisations that have been progressed in PNOMIS (without a db record)', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        offenderNo: 'B2345XY',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Any other status',
        pnomis: 'PNOMIS',
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
  test('shows security referred tag', () => {
    offendersService.getUncategorisedOffenders.mockResolvedValue([
      {
        securityReferred: true,
      },
    ])
    return request(app)
      .get('/categoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Security referred')
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
    return request(app).get('/').expect(302).expect('location', '/categoriserHome')
  })

  test('supervisor user', () => {
    roles = ['ROLE_APPROVE_CATEGORISATION', 'other_role']
    return request(app).get('/').expect(302).expect('location', '/supervisorHome')
  })

  test('security user', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    return request(app).get('/').expect(302).expect('location', '/securityHome')
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
        expect(res.text).toMatch(/Digital Prison Services/s)
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
  test('security referred tag is displayed', () => {
    offendersService.getRecategoriseOffenders.mockResolvedValue([{ securityReferred: true }])
    formService.getRiskChangeCount.mockResolvedValue(4)
    return request(app)
      .get('/recategoriserHome')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Security referred')
        expect(offendersService.getRecategoriseOffenders).toBeCalledTimes(1)
      })
  })
  test('rejects invalid filter options', () => {
    return request(app)
      .get('/recategoriserHome?suitabilityForOpenConditions%5B%5D=something')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Invalid recategoriser home filters')
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
        expect(res.text).toMatch(/Digital Prison Services/s)
        expect(res.text).toMatch(/G9964UP.+G0581UW/s)
        expect(offendersService.getReferredOffenders).toBeCalledTimes(1)
      })
  })
})

describe('security upcoming', () => {
  const upcoming = [
    {
      prisonId: 'MDI',
      userId: 'CGLYNN_TEST',
      status: 'NEW',
      raisedDate: '2021-06-21T14:31:01.123Z',
      offenderNo: 'G9084UJ',
      processedDate: null,
      displayName: 'Wygant, Fairfax',
      securityReferredBy: 'Connor Glynn',
      bookingId: 1201174,
    },
    {
      prisonId: 'MDI',
      userId: 'CGLYNN_TEST',
      status: 'REFERRED',
      raisedDate: '2021-04-20T16:18:50.866Z',
      offenderNo: 'G0242GG',
      processedDate: '2021-04-20T16:19:00.215Z',
      displayName: 'Scarton, Adolphus',
      securityReferredBy: 'Connor Glynn',
      daysSinceSentence: 2617,
      dateRequired: '06/05/2014',
      sentenceDate: '2014-04-22',
      overdue: true,
      bookingId: 801953,
    },
    {
      prisonId: 'MDI',
      userId: 'CGLYNN_TEST',
      status: 'NEW',
      raisedDate: '2021-02-16T11:04:17.421Z',
      offenderNo: 'G2996UX',
      processedDate: null,
      displayName: 'Aves, Benjie',
      securityReferredBy: 'Connor Glynn',
      daysSinceSentence: 2437,
      dateRequired: '03/11/2014',
      sentenceDate: '2014-10-19',
      overdue: true,
      bookingId: 913232,
    },
  ]
  test('displays offenders returned from service', () => {
    offendersService.getUpcomingReferredOffenders.mockResolvedValue(upcoming)
    return request(app)
      .get('/securityUpcoming')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services/s)
        expect(res.text).toMatch(/.+G9084UJ.+G0242GG.+G2996UX/s)
        expect(offendersService.getUpcomingReferredOffenders).toBeCalledTimes(1)
      })
  })
})

describe('Security Landing page', () => {
  offendersService.getCategoryHistory.mockResolvedValue({ history: [] })
  formService.getNextReview.mockResolvedValue([])

  test('security user get', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userService.getUser.mockResolvedValue({ activeCaseLoad: 'LEI', roles: { security: true } })
    offenderServiceGetOffenderDetails()
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({})

    return request(app)
      .get('/12345')
      .redirects(1)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Dexter Spaniel')
        expect(res.text).toContain('securityButton')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(0)
        expect(offendersService.requiredCatType).toBeCalledTimes(1)
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
    offenderServiceGetOffenderDetails()
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'LEI',
      userId: 'me',
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
    offenderServiceGetOffenderDetails()
    offendersService.requiredCatType.mockResolvedValue('INITIAL')

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
    offenderServiceGetOffenderDetails()
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
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
    offenderServiceGetOffenderDetails()
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
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
    userService.getUser.mockResolvedValue({ username: 'meee', activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({ offenderNo: 'B2345XY', bookingId: 12, agencyId: 'BXI' })
    formService.getLiteCategorisation.mockResolvedValue({})
    formService.getCategorisationRecord.mockResolvedValue({})
    return request(app)
      .post('/securityLanding/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Automatic referral setup successful')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(formService.createSecurityReferral).toBeCalledWith('BXI', 'B2345XY', 'meee', mockTransactionalClient)
      })
  })

  test('security user post - cat in progress', () => {
    userService.getUser.mockResolvedValue({ username: 'meee', activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({ offenderNo: 'B2345XY', bookingId: 12, agencyId: 'BXI' })
    formService.getLiteCategorisation.mockResolvedValue({})
    formService.getCategorisationRecord.mockResolvedValue({ status: Status.STARTED.name })
    return request(app)
      .post('/securityLanding/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: A categorisation is already in progress')
        expect(formService.createSecurityReferral).not.toBeCalled()
      })
  })

  test('security user post - lite cat in progress', () => {
    userService.getUser.mockResolvedValue({ username: 'meee', activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({ offenderNo: 'B2345XY', bookingId: 12, agencyId: 'BXI' })
    formService.getLiteCategorisation.mockResolvedValue({ bookingId: 12 })
    formService.getCategorisationRecord.mockResolvedValue({})
    return request(app)
      .post('/securityLanding/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: A categorisation is already in progress')
        expect(formService.createSecurityReferral).not.toBeCalled()
      })
  })

  test('Cancel referral', () => {
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
    offenderServiceGetOffenderDetails()

    return request(app)
      .get('/securityLanding/cancel/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Dexter Spaniel')
        expect(res.text).toContain('Confirm cancellation')
        expect(res.text).toContain('Are you sure you want to cancel this referral?')
      })
  })

  test('Post cancel referral', () => {
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
    formService.isValid.mockReturnValue(true)
    offenderServiceGetOffenderDetails()
    formService.cancelSecurityReferral.mockResolvedValue(true)

    return request(app)
      .post('/securityLanding/cancel/12345')
      .send({ confirm: 'Yes' })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(formService.cancelSecurityReferral).toBeCalledWith('B2345XY', mockTransactionalClient)
      })
  })
})

describe('Switching roles', () => {
  test('when on landing page', () =>
    request(app)
      .get('/switchRole/categoriser')
      .set('referer', 'http://localhost/securityLanding/123456')
      .expect(302)
      .expect('Location', '/123456'))

  test('when no referer', () => request(app).get('/switchRole/categoriser').expect(302).expect('Location', '/'))

  test('when some other page', () =>
    request(app)
      .get('/switchRole/categoriser')
      .set('referer', 'http://localhost/otherpage/123456')
      .expect(302)
      .expect('Location', '/'))
})

describe('TPRS banner appears on landing page', () => {
  test('Categoriser - landing page shows TPRS banner for male prison', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'C',
              overriddenCategory: 'D',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'Yes' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Recategoriser - landing page shows TPRS banner for male prison', () => {
    roles = ['ROLE_CREATE_RECATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        recat: { decision: { category: 'D' } },
        supervisor: { review: { proposedCateogry: 'D', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('RECAT')
    return request(app)
      .get(`/recategoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Supervisor -landing page shows TPRS banner for male prison', () => {
    roles = ['ROLE_APPROVE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        recat: { decision: { category: 'D' } },
        supervisor: { review: { proposedCateogry: 'D', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('RECAT')
    return request(app)
      .get(`/supervisorLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Security - landing page shows TPRS banner for male prison', () => {
    roles = ['ROLE_CATEGORISATION_SECURITY']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        recat: { decision: { category: 'D' } },
        supervisor: { review: { proposedCateogry: 'D', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('RECAT')
    return request(app)
      .get(`/securityLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Categoriser - landing page shows TPRS banner for female prison', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userService.getUser.mockResolvedValue({
      activeCaseLoad: {
        caseLoadId: 'PFI',
        description: 'Peterborough Female (HMP & YOI)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        female: true,
      },
      roles: { security: true },
    })
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'PFI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'T', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'R',
              overriddenCategory: 'T',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'Yes' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Recategoriser - landing page shows TPRS banner for female prison YOI', () => {
    roles = ['ROLE_CREATE_RECATEGORISATION']
    userService.getUser.mockResolvedValue({
      activeCaseLoad: {
        caseLoadId: 'PFI',
        description: 'Peterborough Female (HMP & YOI)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        female: true,
      },
      roles: { security: true },
    })
    formService.isYoungOffender.mockReturnValue(true)
    offenderServiceGetOffenderDetails()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'PFI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        recat: { decision: { category: 'J' } },
        supervisor: { review: { proposedCateogry: 'I', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('RECAT')
    return request(app)
      .get(`/recategoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsLandingBanner"')
      })
  })

  test('Categoriser - landing page does not show TPRS banner for male prison', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'C',
              overriddenCategory: 'D',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'No' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: false,
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserlanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsLandingBanner"')
      })
  })

  test('Recategoriser - landing page does not show TPRS banner for female prison', () => {
    roles = ['ROLE_CREATE_RECATEGORISATION']
    userService.getUser.mockResolvedValue({
      activeCaseLoad: {
        caseLoadId: 'PFI',
        description: 'Peterborough Female (HMP & YOI)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        female: true,
      },
      roles: { security: true },
    })
    offenderServiceGetOffenderDetails()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'PFI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        recat: { decision: { category: 'T' } },
        supervisor: { review: { proposedCateogry: 'R', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: false,
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('RECAT')
    return request(app)
      .get(`/recategoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsLandingBanner"')
      })
  })

  test('Landing page does not shows TPRS banner if not the top history item has tprs', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'C',
              overriddenCategory: 'D',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'Yes' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: false,
          classificationCode: 'D',
        },
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-10',
          tprsSelected: true,
          classificationCode: 'D',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsLandingBanner"')
      })
  })

  test('Landing page does not shows TPRS banner if history is empty', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'C',
              overriddenCategory: 'D',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'Yes' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsLandingBanner"')
      })
  })

  test('Landing page does not shows TPRS banner if the history item is not open', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    userServiceGetUser()
    offenderServiceGetOffenderDetails()

    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2023-03-13'),
      formObject: {
        ratings: {
          supervisor: {
            review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'C',
              overriddenCategory: 'D',
              categoryAppropriate: 'No',
            },
          },
          openConditions: {
            openConditionsRequested: true,
            tprs: { tprsSelected: 'Yes' },
          },
        },
      },
    })
    offendersService.getCategoryHistory.mockResolvedValue({
      history: [
        {
          bookingId: 12,
          recordExists: true,
          approvalDate: '2023-03-13',
          tprsSelected: true,
          classificationCode: 'C',
        },
      ],
    })
    formService.getNextReview.mockResolvedValue([])
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    return request(app)
      .get(`/categoriserLanding/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsLandingBanner"')
      })
  })
})
