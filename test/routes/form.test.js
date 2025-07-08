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
const { makeTestFeatureFlagDto } = require('../../server/middleware/featureFlag.test-factory')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
const context = {
  featureFlags: makeTestFeatureFlagDto(),
  user: { token: 'ABCDEF', username: 'me' },
}

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
  getSecurityReferral: jest.fn(),
  cancelOpenConditions: jest.fn(),
  categoriserDecision: jest.fn(),
}

const riskProfilerService = {
  getSecurityProfile: jest.fn(),
  getViolenceProfile: jest.fn(),
  getEscapeProfile: jest.fn(),
  getExtremismProfile: jest.fn(),
  getLifeProfile: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createOrUpdateCategorisation: jest.fn(),
  getPrisonerBackground: jest.fn(),
  getOptionalAssessmentAgencyDescription: jest.fn(),
  requiredCatType: jest.fn(),
  backToCategoriser: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
  getUserByUserId: jest.fn(),
}

const formRoute = createRouter({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  authenticationMiddleware,
})

const mockFemalePrison = () => {
  userService.getUser.mockResolvedValue({
    activeCaseLoad: {
      caseLoadId: 'PFI',
      description: 'Peterborough Female HMP',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: true,
      female: true,
    },
  })
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
}
const mockMalePrison = () => {
  userService.getUser.mockResolvedValue({
    activeCaseLoad: {
      caseLoadId: 'PBI',
      description: 'Peterborough HMP',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: true,
      female: false,
    },
  })
}
let app

beforeEach(() => {
  app = appSetup(formRoute)
  formService.getCategorisationRecord.mockResolvedValue({ status: 'STARTED', bookingId: 12345, formObject: {} })
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.recordNomisSeqNumber.mockReturnValue({})
  formService.getSecurityReferral.mockReturnValue({})
  offendersService.createOrUpdateCategorisation.mockReturnValue({ bookingId: 12, seq: 4 })
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

describe('GET provisionalCategory page', () => {
  test('GET mens provisional category page', () => {
    mockMalePrison()
    return request(app)
      .get('/categoriser/provisionalCategory/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Provisional category')
        expect(offendersService.getCatAInformation).toBeCalledTimes(0)
        expect(userService.getUser).toBeCalledTimes(1)
      })
  })
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
      }),
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
      }),
  )
  test('categoriser cannot edit security page if page is locked - redirect to tasklist)', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_MANUAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {},
    })
    return request(app).get('/ratings/securityInput/12345').expect(302).expect('Location', `/tasklist/12345`)
  })
})

describe('GET /security/review', () => {
  test.each`
    path                       | expectedContent
    ${'security/review/12345'} | ${'Security review'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(res.text).toContain('Claire Dent')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
      }),
  )

  test('security user get - referred by current user', () => {
    userService.getUser.mockResolvedValue({ username: 'CT_SEC', activeCaseLoad: 'LEI', roles: { security: true } })
    offendersService.getOffenderDetails.mockResolvedValue({
      offenderNo: 'B2345XY',
      bookingId: 12,
      displayName: 'Dexter Spaniel',
    })
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'LEI',
      userId: 'CT_SEC',
      status: 'NEW',
      raisedDate: '2019-10-17T11:34:35.740Z',
    })

    return request(app)
      .get('/security/review/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Dexter Spaniel')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(0)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledTimes(0)
      })
  })

  test('security user get - referred by another user from a different prison', () => {
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
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'ANI',
      userId: 'ANOTHER',
      status: 'REFERRED',
      raisedDate: '2019-10-17T11:34:35.740Z',
    })
    userService.getUserByUserId.mockResolvedValue({
      displayNameAlternative: 'James Brown',
      roles: { security: true },
    })
    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('Another (HMP)')
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_FLAGGED',
      bookingId: 12345,
      formObject: {},
    })

    return request(app)
      .get('/security/review/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Flagged for review')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledWith(expect.anything(), 'ANI')
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledTimes(1)
        expect(userService.getUserByUserId).toBeCalledTimes(1)
      })
  })

  test('security user get - referred by another user from the same prison', () => {
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
    offendersService.requiredCatType.mockResolvedValue('INITIAL')
    formService.getSecurityReferral.mockResolvedValue({
      prisonId: 'LEI',
      userId: 'ANOTHER',
      status: 'REFERRED',
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
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'SECURITY_FLAGGED',
      bookingId: 12345,
      formObject: {},
    })

    return request(app)
      .get('/security/review/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Flagged for review')
        expect(res.text).not.toContain('securityButton')
        expect(offendersService.getOffenderDetails).toBeCalledTimes(1)
        expect(offendersService.getOptionalAssessmentAgencyDescription).toBeCalledTimes(0)
        expect(userService.getUserByUserId).toBeCalledTimes(1)
      })
  })
})

describe('GET /approvedView', () => {
  test('Initial categorisation - Next review date is shown with category C', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        ratings: { nextReviewDate: { date: '25/11/2024' } },
        categoriser: { provisionalCategory: { suggestedCategory: 'C' } },
        supervisor: { review: { proposedCategory: 'C', supervisorCategoryAppropriate: 'Yes' } },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends Category C')
        expect(res.text).toContain('The supervisor also recommends Category C')
        expect(res.text).toContain('Next category review date')
        expect(res.text).toContain('Monday 25 November 2024')
      })
  })

  test('Initial categorisation - Next review date section is hidden, if no data exists (records recorded before functionality was added) with other ridden category', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        categoriser: { provisionalCategory: { suggestedCategory: 'C' } },
        supervisor: {
          review: {
            proposedCategory: 'C',
            supervisorOverriddenCategory: 'B',
            supervisorCategoryAppropriate: 'No',
            supervisorOverriddenCategoryTest: 'some text',
          },
        },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends Category C')
        expect(res.text).toContain('The recommended category was changed from Category C to Category B')
        expect(res.text).not.toContain('Next category review date')
      })
  })

  test('Recat -Open conditions entry is displayed on done view (after being abandoned), with no change links', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2019-08-13'),
      formObject: {
        openConditions: { field: 'value' },
        recat: { decision: { category: 'D' } },
        supervisor: { review: { proposedCateogry: 'D', supervisorCategoryAppriate: 'Yes' } },
      },
    })

    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('HMP MyPrison')

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends open category')
        expect(res.text).toContain('The supervisor also recommends open category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
        expect(res.text).toContain('Tuesday 13 August 2019')
        expect(res.text).toContain('HMP MyPrison')
      })
  })

  test('Initial Categorisation -Open conditions entry is displayed on done view (after being abandoned), with no change links', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: { field: 'value' },
        recat: { decision: { category: 'X' } },
        supervisor: { review: { proposedCateogry: 'X', supervisorCategoryAppriate: 'Yes' } },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends undefined category')
        expect(res.text).toContain('The supervisor also recommends undefined category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Initial Categorisation -Open conditions entry is displayed on done view , with no change links', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: { field: 'value' },
        openConditionsRequested: true,
        recat: { decision: { category: 'X' } },
        supervisor: { review: { proposedCateogry: 'X', supervisorCategoryAppriate: 'Yes' } },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends undefined category')
        expect(res.text).toContain('The supervisor also recommends undefined category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).not.toContain('/form/openConditions/foreignNational/')
      })
  })

  test('Initial Womens categorisation - Next review date is shown with category closed', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        ratings: { nextReviewDate: { date: '25/11/2024' } },
        categoriser: { provisionalCategory: { suggestedCategory: 'R' } },
        supervisor: { review: { proposedCategory: 'R', supervisorCategoryAppropriate: 'Yes' } },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Closed category')
        expect(res.text).toContain('The categoriser recommends closed category')
        expect(res.text).toContain('The supervisor also recommends closed category')
        expect(res.text).toContain('Next category review date')
        expect(res.text).toContain('Monday 25 November 2024')
      })
  })

  test('Recat Womens  - Open conditions entry is displayed on approved view', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'PFI',
      approvalDate: moment('2019-08-13'),
      formObject: {
        openConditions: { field: 'value' },
        recat: { decision: { category: 'T' } },
        supervisor: { review: { proposedCategory: 'T', supervisorCategoryAppropiate: 'Yes' } },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends open category')
        expect(res.text).toContain('The supervisor also recommends open category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Tuesday 13 August 2019')
      })
  })

  test('Recat YOI Womens  - Open conditions entry is displayed on approved view', () => {
    userService.getUser.mockResolvedValue({
      activeCaseLoad: {
        caseLoadId: 'AGI',
        description: 'Askham Grange (HMP & YOI)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
        female: true,
      },
    })
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'PFI',
      approvalDate: moment('2019-08-13'),
      formObject: {
        openConditions: {
          field: 'value',
        },
        recat: { decision: { category: 'J' } },
        supervisor: {
          review: {
            proposedCategory: 'J',
            supervisorOverriddenCategory: 'I',
            supervisorCategoryAppropriate: 'No',
            supervisorOverriddenCategoryTest: 'some text',
          },
        },
      },
    })

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends YOI open category')
        expect(res.text).toContain('The recommended category was changed from YOI open category to YOI closed category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Tuesday 13 August 2019')
      })
  })
})

describe('GET /awaitingApprovalView', () => {
  test('Initial categorisation - Open conditions entry is displayed on awaiting approval view (after being abandoned), with no change links', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: { field: 'value' },
        categoriser: { provisionalCategory: { suggestedCategory: 'D' } },
      },
    })

    return request(app)
      .get(`/awaitingApprovalView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category for approval is open category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
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
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('No, consider for open')
        expect(res.text).not.toContain('No, closed is more appropriate')
        expect(res.text).not.toContain(`id="femaleBanner"`)
      })
  })

  test('supervisor approval page should show tprs banner for initial categorisations', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'Yes' },
        },
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'D',
          },
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsBanner"')
      })
  })

  test('supervisor approval page should not show tprs banner for initial categorisations', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'No' },
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsBanner"')
      })
  })

  test('supervisor approval page should show NOT tprs banner for initial categorisations when category is NOT open', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'Yes' },
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsBanner"')
      })
  })

  test('supervisor approval page should show tprs banner for recats', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'Yes' },
        },
        recat: {
          decision: {
            category: 'D',
          },
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('id="tprsBanner"')
      })
  })

  test('supervisor approval page should not show tprs banner for recats', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'No' },
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsBanner"')
      })
  })

  test('supervisor approval page should NOT show tprs banner for recats if category is NOT open', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          tprs: { tprsSelected: 'Yes' },
        },
      },
      recat: {
        decision: {
          category: 'C',
        },
      },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('id="tprsBanner"')
      })
  })

  test('initial categorisations female, closed override with open', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { categoriser: { provisionalCategory: { suggestedCategory: 'R' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).not.toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).toContain('changeCategoryTo_T')
        expect(res.text).toContain(`id="femaleBanner"`)
        expect(res.text).toContain(`id="openConditionsInfoMessage"`)
      })
  })

  test('initial categorisations female, open override with closed', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { categoriser: { provisionalCategory: { suggestedCategory: 'T' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).not.toContain('changeCategoryTo_D')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })

  test('initial categorisations YOI female, suggested closed shows correct page', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { categoriser: { provisionalCategory: { suggestedCategory: 'R' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).not.toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).toContain('changeCategoryTo_I')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).toContain(`id="femaleBanner"`)
        expect(res.text).toContain(`id="openConditionsInfoMessage"`)
      })
  })

  test('initial categorisations female, suggested YOI open shows correct page', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { categoriser: { provisionalCategory: { suggestedCategory: 'J' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).not.toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('changeCategoryTo_J')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).toContain('changeCategoryTo_I')
      })
  })

  test('initial categorisations female, suggested YOI closed shows correct page', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { categoriser: { provisionalCategory: { suggestedCategory: 'I' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('Prisoner background')
        expect(res.text).not.toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).toContain('changeCategoryTo_J')
      })
  })

  test('Re-categorisations male', () => {
    mockMalePrison()
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
        expect(res.text).toContain('changeCategoryTo_B')
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })

  test('Re-categorisations male, YOI closed override with YOI open', () => {
    mockMalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'I' } } },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_B')
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('changeCategoryTo_R')
      })
  })

  test('Re-categorisations female, closed override with open', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'R' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_C')
        expect(res.text).not.toContain('changeCategoryTo_D')
      })
  })

  test('Re-categorisations female, open override with close', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'T' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_C')
        expect(res.text).not.toContain('changeCategoryTo_D')
      })
  })

  test('Re-categorisations female, YOI closed override with YOI open', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'I' } } },
    })
    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('value="T" checked')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('value="T" checked')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_C')
        expect(res.text).not.toContain('changeCategoryTo_D')
      })
  })

  test('Re-categorisations YOI female, YOI open override with YOI close', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'J' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('value="T" checked')
        expect(res.text).toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('value="R" checked')
        expect(res.text).toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_C')
        expect(res.text).not.toContain('changeCategoryTo_D')
      })
  })

  test('Re-categorisations YOI female, closed override with YOI closed', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: { recat: { decision: { category: 'R' } } },
    })

    return request(app)
      .get(`/supervisor/review/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Prisoner background')
        expect(res.text).toContain('changeCategoryTo_T')
        expect(res.text).not.toContain('value="T" checked')
        expect(res.text).toContain('changeCategoryTo_I')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_C')
        expect(res.text).not.toContain('changeCategoryTo_D')
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
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
      })
  })

  test('supervisor override decision options for young offender - proposed cat C', () => {
    formService.isYoungOffender.mockReturnValue(true)
    mockMalePrison()
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
        expect(res.text).toContain('changeCategoryTo_B')
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })

  test('supervisor override decision options - proposed cat B', () => {
    mockMalePrison()
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
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })

  test('supervisor override decision options - young offender proposed cat I ', () => {
    mockMalePrison()
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
        expect(res.text).toContain('changeCategoryTo_B')
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_I')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })

  test('supervisor override decision options - young offender proposed cat B', () => {
    mockMalePrison()
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
        expect(res.text).toContain('changeCategoryTo_C')
        expect(res.text).toContain('changeCategoryTo_D')
        expect(res.text).toContain('changeCategoryTo_I')
        expect(res.text).toContain('changeCategoryTo_J')
        expect(res.text).not.toContain('changeCategoryTo_B')
        expect(res.text).not.toContain('changeCategoryTo_R')
        expect(res.text).not.toContain('changeCategoryTo_T')
      })
  })
})

describe('GET /supervisor/confirmBack', () => {
  test('breadcrumb', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'AWAITING_APPROVAL',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'I' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({
      bookingId: 12345,
    })
    return request(app)
      .get(`/supervisor/confirmBack/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard.+Approve category/s)
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
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard.+Categorisation task list/s)
        expect(res.text).toContain(
          'This person has not been reported as the perpetrator in any assaults in custody before.',
        )
        expect(res.text).not.toContain("'This person has been reported as the perpetrator")
      }),
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
      numberOfNonSeriousAssaults: 3,
    })
    return request(app)
      .get(`/ratings/violenceRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toMatch(
          /This person has been reported as the perpetrator in 5 assaults in custody before,\s+including 2 serious assaults and 3 non-serious assaults in the past 12 months./,
        )
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
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard.+Categorisation task list/s)
        expect(riskProfilerService.getExtremismProfile).toBeCalledTimes(1)
      }),
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
      .expect(res => {
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
          mockTransactionalClient,
        )
        expect(formService.updateFormData).not.toBeCalled()
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard.+Categorisation task list/s)
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

  test('INITIAL Categorisation for mens prison with open conditions entry', () => {
    mockMalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'No' } },
        openConditions: {
          furtherCharges: { furtherCharges: 'No', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers before you continue')
        expect(res.text).toContain('Further serious charges')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Are they facing any further charges?')
      })
  })

  test('INITIAL Categorisation for mens prison without open conditions entry', () => {
    mockMalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'No' } },
      },
    })

    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers before you continue')
        expect(res.text).toContain('Further serious charges')
        expect(res.text).not.toContain('Open Conditions')
        expect(res.text).not.toContain('Are they facing any further charges?')
        expect(res.text).not.toContain('categoryDecisionSummary')
      })
  })

  test('INITIAL Categorisation for womens prison with open conditions entry', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          furtherCharges: { furtherCharges: 'No', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
    })
    return request(app)
      .get(`/categoriser/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers before submitting')
        expect(res.text).not.toContain('Further serious charges')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Are they facing any further charges?')
        expect(res.text).toContain('categoryDecisionSummary')
      })
  })
})

describe('GET /recat/review', () => {
  test('RECAT Categorisation for mens prison with open conditions entry', () => {
    mockMalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          furtherCharges: {
            furtherCharges: 'No',
            furtherChargesText: 'new stuff',
            increasedRisk: 'No',
          },
        },
      },
    })

    return request(app)
      .get(`/recat/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers before submitting')
        expect(res.text).toContain('Prisoner background')
        expect(res.text).not.toContain('Further serious charges')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Are they facing any further charges?')
      })
  })

  test('RECAT Categorisation for womens prison with open conditions entry', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        openConditions: {
          furtherCharges: { furtherCharges: 'No', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
    })
    return request(app)
      .get(`/recat/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Check your answers before submitting')
        expect(res.text).toContain('Prisoner background')
        expect(res.text).not.toContain('Further serious charges')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Are they facing any further charges?')
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
      ${'ratings'} | ${'decision'}         | ${{ category: 'R' }}    | ${'/tasklist/'}
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
        }),
    )
  })
})
describe('POST /supervisor/review', () => {
  test('Should delete recat decision if overriding to open conditions', () => {
    const userInput = {
      supervisorDecision: 'changeCategoryTo_D',
      catType: 'RECAT',
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
        })
      })
  })

  test('Should get and persist prisoner background for recategorisation approvals', () => {
    const userInput = { catType: 'RECAT' }
    const catHistory = [{ history: 12 }, { history: 12 }]
    offendersService.getPrisonerBackground.mockResolvedValue(catHistory)

    return request(app)
      .post(`/supervisor/further-information/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(offendersService.getPrisonerBackground).toBeCalledTimes(1)
        expect(formService.mergeRiskProfileData).toBeCalledWith('12345', { catHistory })
      })
  })

  test('Should not get prisoner background for initial categorisation approvals', () => {
    const userInput = { catType: 'INITIAL' }

    return request(app)
      .post(`/supervisor/further-information/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(offendersService.getPrisonerBackground).toBeCalledTimes(0)
        expect(formService.mergeRiskProfileData).toBeCalledTimes(0)
      })
  })

  test('should delete recat decision if overriding to open conditions - female', () => {
    mockFemalePrison()
    const userInput = {
      supervisorDecision: 'changeCategoryTo_T',
      catType: 'RECAT',
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
        })
      })
  })

  test('Should get and persist prisoner background for recategorisation approvals - female', () => {
    mockFemalePrison()
    const userInput = { catType: 'RECAT' }
    const catHistory = [{ history: 12 }, { history: 12 }]
    offendersService.getPrisonerBackground.mockResolvedValue(catHistory)

    return request(app)
      .post(`/supervisor/further-information/12345`)
      .send(userInput)
      .expect(302)
      .expect(() => {
        expect(offendersService.getPrisonerBackground).toBeCalledTimes(1)
        expect(formService.mergeRiskProfileData).toBeCalledWith('12345', { catHistory })
      })
  })

  test('Should not get prisoner background for initial categorisation approvals - female', () => {
    mockFemalePrison()
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
  test('redirects to supervisor home if confirmed', () =>
    request(app)
      .post('/supervisor/confirmBack/12345')
      .send({ messageText: 'Something' })
      .expect(302)
      .expect('Location', `/supervisorHome`)
      .expect(() => {
        expect(offendersService.backToCategoriser).toBeCalledWith(expect.anything(), '12345', mockTransactionalClient)
      }))
})

describe('Submit provisionalCategory page', () => {
  test('Submit mens provisional category page for CAT-D', () => {
    mockMalePrison()
    return request(app)
      .post('/categoriser/provisionalCategory/12345')
      .send({ suggestedCategory: 'C', overriddenCategory: 'D', overriddenCategoryText: 'text' })
      .expect(302)
      .expect('Location', '/openConditionsAdded/12345?catType=INITIAL')
      .expect(() => {
        expect(formService.categoriserDecisionWithFormResponse).toBeCalledTimes(0)
      })
  })

  test('Submit mens provisional category page for non-existent category', () => {
    mockMalePrison()
    return request(app)
      .post('/categoriser/provisionalCategory/12345')
      .send({ suggestedCategory: 'B', overriddenCategory: 'F', overriddenCategoryText: 'HHH' })
      .expect(302)
      .expect('Location', '/tasklist/categoriserSubmitted/12345')
      .expect(() => {
        expect(formService.categoriserDecisionWithFormResponse).toBeCalledTimes(1)
        const updateArg = formService.categoriserDecisionWithFormResponse.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.userId).toBe('CA_USER_TEST')
        expect(offendersService.createOrUpdateCategorisation).toBeCalledWith({
          bookingId: 12345,
          context: {
            featureFlags: makeTestFeatureFlagDto(),
            user: {
              token: 'ABCDEF',
              username: 'me',
            },
          },
          nextReviewDate: undefined,
          nomisSeq: undefined,
          overriddenCategory: 'F',
          overriddenCategoryText: 'HHH',
          suggestedCategory: 'B',
          transactionalDbClient: mockTransactionalClient,
        })
      })
  })

  test('Get womens category decision page should render a correct page', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get('/ratings/decision/12345')
      .expect(200)
      .expect(res => {
        expect(userService.getUser).toBeCalledTimes(1)
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain(`id="openOption"`)
        expect(res.text).toContain(`id="closedOption"`)
      })
  })

  test('Get womens YOI category decision page should render a correct page', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get('/ratings/decision/12345')
      .expect(200)
      .expect(res => {
        expect(userService.getUser).toBeCalledTimes(1)
        expect(res.text).toContain('Category decision')
        expect(res.text).not.toContain(`id="openOption"`)
        expect(res.text).toContain(`id="closedOption"`)
        expect(res.text).toContain(`id="catIOption"`)
        expect(res.text).toContain(`id="catJOption"`)
      })
  })

  test('Post womens category decision page with option closed selected should save closed and redirect to task list', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .post('/ratings/decision/12345')
      .send({ category: 'R' })
      .expect(302)
      .expect('Location', '/tasklist/12345')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        const updateArg = formService.update.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.config).toBe(formConfig.ratings.decision)
        expect(formService.cancelOpenConditions).toBeCalledTimes(1)
        expect(formService.requiresOpenConditions).toBeCalledTimes(0)
      })
  })
  test('Post womens category decision page with option open selected should save open and redirect to open conditions confirmation screen', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .post('/ratings/decision/12345')
      .send({ category: 'T' })
      .expect(302)
      .expect('Location', '/openConditionsAdded/12345?catType=INITIAL')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        const updateArg = formService.update.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.config).toBe(formConfig.ratings.decision)
        expect(formService.cancelOpenConditions).toBeCalledTimes(0)
        expect(formService.requiresOpenConditions).toBeCalledTimes(1)
      })
  })
  test('Post womens category decision page with option YOI closed selected should save closed and redirect to task list', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .post('/ratings/decision/12345')
      .send({ category: 'I' })
      .expect(302)
      .expect('Location', '/tasklist/12345')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        const updateArg = formService.update.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.config).toBe(formConfig.ratings.decision)
        expect(formService.cancelOpenConditions).toBeCalledTimes(1)
        expect(formService.requiresOpenConditions).toBeCalledTimes(0)
      })
  })
  test('Post womens category decision page with option YOI open selected should save open and redirect to open conditions confirmation screen', () => {
    mockFemalePrison()
    return request(app)
      .post('/ratings/decision/12345')
      .send({ category: 'J' })
      .expect(302)
      .expect('Location', '/openConditionsAdded/12345?catType=INITIAL')
      .expect(() => {
        expect(formService.update).toBeCalledTimes(1)
        const updateArg = formService.update.mock.calls[0][0]
        expect(updateArg.bookingId).toBe(12345)
        expect(updateArg.config).toBe(formConfig.ratings.decision)
        expect(formService.cancelOpenConditions).toBeCalledTimes(0)
        expect(formService.requiresOpenConditions).toBeCalledTimes(1)
      })
  })
  test('Submit mens CYA page', () => {
    mockMalePrison()
    return request(app)
      .post('/categoriser/review/12345')
      .expect(302)
      .expect('Location', '/form/categoriser/provisionalCategory/12345')
      .expect(() => {
        expect(formService.getCategorisationRecord).not.toBeCalled()
        expect(formService.categoriserDecision).not.toBeCalled()
        expect(offendersService.createOrUpdateCategorisation).not.toBeCalled()
      })
  })

  test('Submit womens CYA page', () => {
    mockFemalePrison()
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      formObject: {
        ratings: { decision: { category: 'R' }, nextReviewDate: { date: '25/11/2024' } },
        categoriser: { provisionalCategory: { suggestedCategory: 'R' } },
        supervisor: { review: { proposedCategory: 'R', supervisorCategoryAppropriate: 'Yes' } },
      },
    })

    return request(app)
      .post('/categoriser/review/12345')
      .expect(302)
      .expect('Location', '/tasklist/categoriserSubmitted/12345')
      .expect(() => {
        expect(formService.getCategorisationRecord).toBeCalledTimes(1)
        expect(formService.categoriserDecisionWithFormResponse).toBeCalledTimes(1)
        expect(offendersService.createOrUpdateCategorisation).toBeCalledTimes(1)
        expect(offendersService.createOrUpdateCategorisation).toBeCalledWith({
          bookingId: 12345,
          context: {
            featureFlags: makeTestFeatureFlagDto(),
            user: {
              activeCaseLoad: {
                caseLoadId: 'PFI',
                caseloadFunction: 'GENERAL',
                currentlyActive: true,
                description: 'Peterborough Female HMP',
                female: true,
                type: 'INST',
              },
              token: 'ABCDEF',
              username: 'me',
            },
          },
          nextReviewDate: '25/11/2024',
          nomisSeq: undefined,
          overriddenCategoryText: 'Cat-tool Initial',
          suggestedCategory: 'R',
          transactionalDbClient: mockTransactionalClient,
        })
      })
  })
})

describe('GET /ratings/escapeRating', () => {
  test('Get mens escape page with no alerts', () => {
    mockMalePrison()
    return request(app)
      .get(`/ratings/escapeRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person is not on the E-List and does not have an escape risk alert.')
        expect(res.text).not.toContain('This person is considered an escape risk')
        expect(res.text).not.toContain('Alert notes')
        expect(res.text).not.toContain('Escape Risk Alert:')
        expect(res.text).not.toContain('Do you think this information means they should be in Cat B?')
        expect(res.text).toContain('Is there any other information to suggest they pose a risk of escape?')
      })
  })

  test('Get mens escape page with an alert', () => {
    mockMalePrison()
    const escapeProfile = {
      nomsId: 'G6706UD',
      provisionalCategorisation: 'C',
      activeEscapeList: false,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2016-12-16',
          expired: false,
          active: true,
        },
      ],
      escapeListAlerts: [],
      riskType: 'ESCAPE',
    }
    riskProfilerService.getEscapeProfile.mockResolvedValue(escapeProfile)
    return request(app)
      .get(`/ratings/escapeRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person is considered an escape risk')
        expect(res.text).toContain('Alert notes')
        expect(res.text).toContain('Escape Risk Alert:')
        expect(res.text).toContain('Do you think this information means they should be in Cat B?')
        expect(res.text).not.toContain('This person is not on the E-List and does not have an escape risk alert.')
        expect(res.text).toContain('Is there any other information to suggest they pose a risk of escape?')
      })
  })

  test('Get womens escape page with no alerts', () => {
    mockFemalePrison()
    return request(app)
      .get(`/ratings/escapeRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person is not on the E-List and does not have an escape risk alert.')
        expect(res.text).not.toContain('This person is considered an escape risk')
        expect(res.text).not.toContain('Alert notes')
        expect(res.text).not.toContain('Escape Risk Alert:')
        expect(res.text).not.toContain('Do you think this information means they should be in Cat B?')
        expect(res.text).toContain('Is there any other information to suggest they pose a risk of escape?')
      })
  })

  test('Get womens escape page with an alert', () => {
    mockFemalePrison()
    const escapeProfile = {
      nomsId: 'G6706UD',
      provisionalCategorisation: 'R',
      activeEscapeList: false,
      activeEscapeRisk: true,
      escapeRiskAlerts: [
        {
          alertCode: 'XER',
          dateCreated: '2016-12-16',
          expired: false,
          active: true,
        },
      ],
      escapeListAlerts: [],
      riskType: 'ESCAPE',
    }
    riskProfilerService.getEscapeProfile.mockResolvedValue(escapeProfile)

    return request(app)
      .get(`/ratings/escapeRating/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('This person is not on the E-List and does not have an escape risk alert.')
        expect(res.text).toContain('This person is considered an escape risk')
        expect(res.text).toContain('Alert notes')
        expect(res.text).toContain('Escape Risk Alert:')
        expect(res.text).not.toContain('Do you think this information means they should be in Cat B?')
        expect(res.text).toContain('Is there any other information to suggest they pose a risk of escape?')
      })
  })
})

describe('TPRS Done view', () => {
  test('Initial - done view displays open conditions', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'INITIAL',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2019-08-13'),
      formObject: {
        ratings: {
          escapeRating: { escapeCatB: 'No', escapeOtherEvidence: 'No' },
          securityBack: { catB: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityInputNeededText: 'normal checks' },
          furtherCharges: { furtherCharges: 'No' },
          nextReviewDate: { date: '23/03/2023', indeterminate: false },
          violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
          extremismRating: { previousTerrorismOffences: 'No' },
          offendingHistory: { previousConvictions: 'No' },
        },
        security: { review: { securityReview: 'nothing to add' } },
        supervisor: { review: { proposedCategory: 'D', supervisorCategoryAppropriate: 'Yes' } },
        categoriser: {
          review: {},
          provisionalCategory: {
            suggestedCategory: 'C',
            overriddenCategory: 'D',
            categoryAppropriate: 'No',
            otherInformationText: '',
            overriddenCategoryText: 'Good behaviour',
          },
        },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
          riskLevels: { likelyToAbscond: 'No' },
          riskOfHarm: { seriousHarm: 'No' },
          furtherCharges: { furtherCharges: 'No' },
          foreignNational: { isForeignNational: 'No' },
          earliestReleaseDate: { fiveOrMoreYears: 'No' },
          victimContactScheme: { vcsOptedFor: 'No' },
        },
      },
    })
    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('HMP MyPrison')

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Open category')
        expect(res.text).toContain('The recommended category was changed from Category C to open category')
        expect(res.text).toContain('The supervisor also recommends open category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Tuesday 13 August 2019')
        expect(res.text).toContain('HMP MyPrison')
        expect(res.text).toContain('earliestReleaseDateSummary')
        expect(res.text).toContain('victimContactSchemeSummary no-print')
        expect(res.text).toContain('foreignNationalSummary')
        expect(res.text).toContain('tprsSummary no-print')
        expect(res.text).toContain('riskOfHarmSummary')
        expect(res.text).toContain('furtherChargesOpenSummary')
        expect(res.text).toContain('riskLevelSummary')
      })
  })

  test('Recat - done view displays open conditions', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'APPROVED',
      catType: 'RECAT',
      bookingId: 12,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
      prisonId: 'MPI',
      approvalDate: moment('2019-08-13'),
      formObject: {
        recat: { decision: { category: 'D' } },
        supervisor: { review: { proposedCateogry: 'D', supervisorCategoryAppropiate: 'Yes' } },
        openConditions: {
          openConditionsRequested: true,
          tprs: { tprsSelected: 'No' },
          riskLevels: { likelyToAbscond: 'No' },
          riskOfHarm: { seriousHarm: 'No' },
          furtherCharges: { furtherCharges: 'No' },
          foreignNational: { isForeignNational: 'No' },
          earliestReleaseDate: { fiveOrMoreYears: 'No' },
          victimContactScheme: { vcsOptedFor: 'No' },
        },
      },
    })

    offendersService.getOptionalAssessmentAgencyDescription.mockResolvedValue('HMP MyPrison')

    return request(app)
      .get(`/approvedView/1234`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The categoriser recommends open category')
        expect(res.text).toContain('The supervisor also recommends open category')
        expect(res.text).toContain('Open Conditions')
        expect(res.text).toContain('Tuesday 13 August 2019')
        expect(res.text).toContain('HMP MyPrison')
        expect(res.text).toContain('earliestReleaseDateSummary')
        expect(res.text).toContain('victimContactSchemeSummary no-print')
        expect(res.text).toContain('foreignNationalSummary')
        expect(res.text).toContain('tprsSummary no-print')
        expect(res.text).toContain('riskOfHarmSummary')
        expect(res.text).toContain('furtherChargesOpenSummary')
        expect(res.text).toContain('riskLevelSummary')
      })
  })
})
