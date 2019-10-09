const request = require('supertest')
const moment = require('moment')
const appSetup = require('./utils/appSetup')
const createRouter = require('../../server/routes/form')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')
const security = require('../../server/config/security')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

const formConfig = {
  ratings,
  categoriser,
  supervisor,
  security,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  update: jest.fn(),
  supervisorApproval: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  computeSuggestedCat: jest.fn().mockReturnValue('B'),
  updateFormData: jest.fn(),
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  requiresOpenConditions: jest.fn(),
  deleteFormData: jest.fn(),
  isValid: jest.fn(),
  isYoungOffender: jest.fn(),
  recordNomisSeqNumber: jest.fn(),
  categoriserDecisionWithFormResponse: jest.fn(),
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
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createInitialCategorisation: jest.fn(),
  getPrisonerBackground: jest.fn(),
  getOptionalAssessmentAgencyDescription: jest.fn(),
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
  formService.getCategorisationRecord.mockResolvedValue({ status: 'STARTED', bookingId: 12345, formObject: {} })
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.recordNomisSeqNumber.mockReturnValue({})
  offendersService.createInitialCategorisation.mockReturnValue({ bookingId: 12, seq: 4 })
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent' })
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
  riskProfilerService.getSecurityProfile.mockResolvedValue({})
  riskProfilerService.getViolenceProfile.mockResolvedValue({})
  riskProfilerService.getExtremismProfile.mockResolvedValue({})
  riskProfilerService.getEscapeProfile.mockResolvedValue({})
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test.each`
    path                                       | expectedContent
    ${'categoriser/provisionalCategory/12345'} | ${'Provisional category'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
      })
  )
})

describe('GET /ratings/offendingHistory', () => {
  test.each`
    path                                | expectedContent
    ${'ratings/offendingHistory/12345'} | ${'Offending history'}
    ${'categoriser/review/12345'}       | ${'Check your answers before you continue'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCatAInformation).toBeCalledTimes(1)
      })
  )
})

describe('GET /ratings/securityInput', () => {
  test.each`
    path                             | expectedContent
    ${'ratings/securityInput/12345'} | ${'Security information'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
        expect(riskProfilerService.getSecurityProfile).toBeCalledTimes(0)
      })
  )
  test('categoriser cannot edit security page if page is locked - redirect to tasklist)', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_MANUAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {},
    })
    return request(app)
      .get('/ratings/securityInput/12345')
      .expect(302)
      .expect('Location', `/tasklist/12345`)
  })
})

describe('GET /security/review', () => {
  test.each`
    path                       | expectedContent
    ${'security/review/12345'} | ${'Security Review'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(res.text).toContain('Claire Dent')
      })
  )
})

describe('GET /approvedView', () => {
  test('Open conditions entry is displayed on done view (after being abandoned), with no change links - RECAT', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2019-08-13'),
      formObject: { openConditions: { field: 'value' } },
    })

    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('HMP MyPrison')

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
        expect(res.text).toContain('Tuesday 13th August 2019')
        expect(res.text).toContain('HMP MyPrison')
      })
  })

  test('Open conditions entry is displayed on done view (after being abandoned), with no change links - INITAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' } },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Open conditions entry is displayed on done view , with no change links - INITAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' }, openConditionsRequested: true },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })
})

describe('GET /awaitingApprovalView', () => {
  test('Open conditions entry is displayed on awaiting approval view (after being abandoned), with no change links - INITAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' } },
    })

    return request(app)
      .get(`/awaitingApprovalView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })
})

describe('GET /supervisor/review', () => {
  test('initial categorisations', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {},
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Prisoner background')
      })
  })

  test('Re-categorisations', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {},
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
      })
  })

  test('Open conditions entry is always displayed after open conditions abandoned', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
      })
  })

  test('supervisor override decision options for young offender - proposed cat C', () => {
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'J' } } },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('overriddenCategoryB')
        expect(res.text).toContain('overriddenCategoryC')
        expect(res.text).toContain('overriddenCategoryD')
        expect(res.text).toContain('overriddenCategoryI')
        expect(res.text).not.toContain('overriddenCategoryJ')
      })
  })

  test('supervisor override decision options - proposed cat B', () => {
    formService.isYoungOffender.mockReturnValue(false)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'B' } } },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('overriddenCategoryB')
        expect(res.text).toContain('overriddenCategoryC')
        expect(res.text).toContain('overriddenCategoryD')
        expect(res.text).not.toContain('overriddenCategoryI')
        expect(res.text).not.toContain('overriddenCategoryJ')
      })
  })

  test('supervisor override decision options - proposed cat B and indeterminate sentence', () => {
    formService.isYoungOffender.mockReturnValue(false)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'B' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('overriddenCategoryB')
        expect(res.text).toContain('Prisoner has indeterminate sentence - Cat D not available')
        expect(res.text).toContain('Changing to Cat C')
        expect(res.text).not.toContain('overriddenCategoryI')
        expect(res.text).not.toContain('overriddenCategoryJ')
      })
  })

  test('supervisor override decision options - proposed cat C and indeterminate sentence', () => {
    formService.isYoungOffender.mockReturnValue(false)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'C' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('overriddenCategoryB')
        expect(res.text).toContain('Prisoner has indeterminate sentence - Cat D not available')
        expect(res.text).toContain('Changing to Cat B')
        expect(res.text).not.toContain('overriddenCategoryI')
        expect(res.text).not.toContain('overriddenCategoryJ')
      })
  })

  test('supervisor override decision options - young offender proposed cat I and indeterminate sentence', () => {
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'I' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('overriddenCategoryB')
        expect(res.text).toContain('overriddenCategoryC')
        expect(res.text).not.toContain('overriddenCategoryI')
        expect(res.text).not.toContain('overriddenCategoryJ')
        expect(res.text).not.toContain('overriddenCategoryD')
      })
  })

  test('supervisor override decision options - young offender proposed cat I ', () => {
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'I' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: false },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('overriddenCategoryB')
        expect(res.text).toContain('overriddenCategoryC')
        expect(res.text).not.toContain('overriddenCategoryI')
        expect(res.text).toContain('overriddenCategoryJ')
        expect(res.text).toContain('overriddenCategoryD')
      })
  })

  test('supervisor override decision options - young offender proposed cat B', () => {
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'B' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: false },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('overriddenCategoryC')
        expect(res.text).toContain('overriddenCategoryD')
        expect(res.text).toContain('overriddenCategoryI')
        expect(res.text).toContain('overriddenCategoryJ')
        expect(res.text).not.toContain('overriddenCategoryB')
      })
  })
})

describe('GET /ratings/violence', () => {
  test.each`
    path                              | expectedContent
    ${'ratings/violenceRating/12345'} | ${'Safety and good order'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(riskProfilerService.getViolenceProfile).toBeCalledTimes(1)
        expect(res.text).toContain(
          'This person has not been reported as the perpetrator in any assaults in custody before.'
        )
        expect(res.text).not.toContain("'This person has been reported as the perpetrator")
      })
  )

  test('violence flag logic - assaults and notify', () => {
    riskProfilerService.getViolenceProfile.mockResolvedValue({
      nomsId: '1234AN',
      riskType: 'VIOLENCE',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: true,
      displayAssaults: true,
      numberOfAssaults: 5,
      numberOfSeriousAssaults: 2,
    })
    return request(app)
      .get(`/ratings/violenceRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person has been reported as the perpetrator in 5 assaults in custody before,')
        expect(res.text).toContain('including 2 serious assaults in the last 12 months')
        expect(res.text).toContain('Please notify your safer custody lead about this prisoner')
      })
  })
})

describe('GET /ratings/extremism', () => {
  test.each`
    path                               | expectedContent
    ${'ratings/extremismRating/12345'} | ${'Extremism'}
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

describe('GET /categoriser/review', () => {
  test('Should perform a merge with existing data when loading review', () => {
    // data that should be persisted
    riskProfilerService.getEscapeProfile.mockResolvedValue({
      flagA: 'B2345XY',
    })
    riskProfilerService.getViolenceProfile.mockResolvedValue({
      violenceFlag: true,
    })
    riskProfilerService.getExtremismProfile.mockResolvedValue({
      exFlag: true,
    })
    formService.getCategorisationRecord.mockResolvedValue({
      formObject: {
        ratings: 'stuff',
        categoriser: 'other things',
      },
    })
    offendersService.getCatAInformation.mockResolvedValue({
      catARisk: true,
    })

    // data for display only (not persisted)
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderName: 'Brian',
    })
    offendersService.getOffenceHistory.mockResolvedValue({
      offence: 'details',
    })

    return request(app)
      .get('/categoriser/review/12345')
      .expect(200)
      .expect(() => {
        expect(formService.mergeRiskProfileData).toBeCalledWith(
          '12345',
          {
            escapeProfile: {
              flagA: 'B2345XY',
            },
            extremismProfile: {
              exFlag: true,
            },
            violenceProfile: {
              violenceFlag: true,
            },
            history: {
              catARisk: true,
            },
            offences: {
              offence: 'details',
            },
          },
          mockTransactionalClient
        )
        expect(formService.updateFormData).not.toBeCalled()
      })
  })

  test('Open conditions entry is displayed after being abandoned, with no change links - RECAT', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' } },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Open conditions entry is displayed after chosen, with change links - RECAT', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' }, openConditionsRequested: true },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Open conditions entry is displayed after being abandoned, with no change links - INITAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' } },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Open conditions entry is displayed after chosen, with change links - INITIAL', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { openConditions: { field: 'value' }, openConditionsRequested: true },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('/form/openConditions/foreignNational/')
      })
  })
})

describe('POST /section/form', () => {
  test.each`
    sectionName  | formName              | userInput               | nextPath
    ${'ratings'} | ${'securityInput'}    | ${{ fullName: 'Name' }} | ${'/tasklist/'}
    ${'ratings'} | ${'violenceRating'}   | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'} | ${'escapeRating'}     | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'} | ${'extremismRating'}  | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'} | ${'offendingHistory'} | ${{ day: '12' }}        | ${'/tasklist/'}
    ${'ratings'} | ${'furtherCharges'}   | ${{}}                   | ${'/tasklist/'}
  `('should render $expectedContent for $sectionName/$formName', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
        const updateArg = formService.update.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.config).toBe(formConfig[sectionName][formName])
      })
  )
})

describe('POST /supervisor/review', () => {
  test.each`
    sectionName     | formName    | userInput        | nextPath
    ${'supervisor'} | ${'review'} | ${{ day: '12' }} | ${'/tasklist/supervisor/outcome/'}
  `('should render $expectedContent for supervisor/review', ({ sectionName, formName, userInput, nextPath }) =>
    request(app)
      .post(`/${sectionName}/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.supervisorApproval).toBeCalledTimes(1)
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
        expect(offendersService.createSupervisorApproval).toBeCalledWith(
          { user: { token: 'ABCDEF' } },
          '12345',
          userInput
        )
        const updateArg = formService.supervisorApproval.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
      })
  )
  test('Should delete recat decision if overriding to open conditions', () => {
    const userInput = {
      supervisorCategoryAppropriate: 'no',
      supervisorOverriddenCategory: 'D',
      supervisorOverriddenCategoryText: 'bla',
    }

    return request(app)
      .post(`/supervisor/review/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
        expect(formService.deleteFormData).toBeCalledTimes(1)
        expect(formService.requiresOpenConditions).toBeCalledTimes(1)
        expect(formService.deleteFormData).toBeCalledWith({
          bookingId: 12345,
          formName: 'decision',
          formSection: 'recat',
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('Should get and persist prisoner background for recategorisation approvals', () => {
    const userInput = { catType: 'RECAT' }
    const catHistory = [{ history: 12 }, { history: 12 }]
    offendersService.getPrisonerBackground.mockResolvedValue(catHistory)

    return request(app)
      .post(`/supervisor/review/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(offendersService.getPrisonerBackground).toBeCalledTimes(1)
        expect(formService.mergeRiskProfileData).toBeCalledWith('12345', { catHistory }, mockTransactionalClient)
      })
  })

  test('Should not get prisoner background for initial categorisation approvals', () => {
    const userInput = { catType: 'INITIAL' }

    return request(app)
      .post(`/supervisor/review/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(offendersService.getPrisonerBackground).toBeCalledTimes(0)
        expect(formService.mergeRiskProfileData).toBeCalledTimes(0)
      })
  })
})

describe('POST /supervisor/confirmBack', () => {
  test('redirects back to review if not confirmed', () =>
    request(app)
      .post('/supervisor/confirmBack/12345')
      .send({ confirmation: 'No' })
      .expect(302)
      .expect('Location', `/form/supervisor/review/12345`))
  test('redirects to supervisor home if confirmed', () =>
    request(app)
      .post('/supervisor/confirmBack/12345')
      .send({ confirmation: 'Yes' })
      .expect(302)
      .expect('Location', `/supervisorHome`)
      .expect(() => {
        expect(formService.backToCategoriser).toBeCalledWith('12345', mockTransactionalClient)
      }))
})

describe('POST /categoriser/provisionalCategory', () => {
  test.each`
    userInput                                                                              | nextPath                                        | isOpen
    ${{ suggestedCategory: 'B', overriddenCategory: 'F', overriddenCategoryText: 'HHH' }}  | ${'/tasklist/categoriserSubmitted/12345'}       | ${false}
    ${{ suggestedCategory: 'C', overriddenCategory: 'D', overriddenCategoryText: 'text' }} | ${'/openConditionsAdded/12345?catType=INITIAL'} | ${true}
  `('should redirect to $nextPath for /categoriser/provisionalCategory', ({ userInput, nextPath, isOpen }) =>
    request(app)
      .post(`/categoriser/provisionalCategory/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}`)
      .expect(() => {
        if (isOpen) {
          expect(formService.categoriserDecisionWithFormResponse).toBeCalledTimes(0)
        } else {
          expect(formService.categoriserDecisionWithFormResponse).toBeCalledTimes(1)
          const updateArg = formService.categoriserDecisionWithFormResponse.mock.calls[0][0]
          expect(updateArg.bookingId).toBe(12345)
          expect(updateArg.userId).toBe('CA_USER_TEST')
          expect(offendersService.createInitialCategorisation).toBeCalledWith({
            context: { user: { token: 'ABCDEF' } },
            bookingId: 12345,
            overriddenCategory: 'F',
            overriddenCategoryText: 'HHH',
            suggestedCategory: 'B',
          })
        }
      })
  )
})
