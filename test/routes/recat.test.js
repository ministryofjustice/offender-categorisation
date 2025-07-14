const request = require('supertest')
const moment = require('moment')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const categoriser = require('../../server/config/categoriser')
const recat = require('../../server/config/recat')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

let roles
// This needs mocking early, before 'requiring' jwt-decode (via home.js)
jest.doMock('jwt-decode', () => jest.fn(() => ({ authorities: roles })))

const createRouter = require('../../server/routes/recat')
const { makeTestFeatureFlagDto } = require('../../server/middleware/featureFlag.test-factory')

const formConfig = {
  recat,
  categoriser,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  update: jest.fn(),
  isYoungOffender: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  computeSuggestedCat: jest.fn().mockReturnValue('B'),
  updateFormData: jest.fn(),
  setAwaitingApproval: jest.fn(),
  requiresOpenConditions: jest.fn(),
  cancelOpenConditions: jest.fn(),
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
  deleteFormData: jest.fn(),
  recordNomisSeqNumber: jest.fn(),
  categoriserDecision: jest.fn(),
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
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createOrUpdateCategorisation: jest.fn(),
  getPrisonerBackground: jest.fn(),
  getRiskChangeForOffender: jest.fn(),
}

const userService = {
  getUser: jest.fn(),
}

const pathfinderService = {
  getExtremismProfile: jest.fn(),
}

const alertService = {
  getEscapeProfile: jest.fn(),
}

const mockFemalePrison = () => {
  offendersService.getOffenderDetails.mockResolvedValue({
    displayName: 'Claire Dent',
    bookingId: 12345,
    offenderNo: 'GH123',
    prisonId: 'PFI',
  })
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
const formRoute = createRouter({
  formService,
  offendersService,
  userService,
  riskProfilerService,
  pathfinderService,
  alertService,
  authenticationMiddleware,
})

let app

beforeEach(() => {
  app = appSetup(formRoute)
  roles = ['ROLE_CREATE_RECATEGORISATION']
  formService.getCategorisationRecord.mockResolvedValue({
    status: 'STARTED',
    offenderNo: 'GH123',
    bookingId: 12345,
    formObject: {},
  })
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.isYoungOffender.mockReturnValue(false)
  formService.deleteFormData.mockReturnValue({})
  formService.recordNomisSeqNumber.mockReturnValue({})
  formService.categoriserDecision.mockReturnValue({})
  offendersService.createOrUpdateCategorisation.mockReturnValue({ bookingId: 12345, seq: 4 })
  offendersService.getOffenderDetails.mockResolvedValue({
    displayName: 'Claire Dent',
    bookingId: 12345,
    offenderNo: 'GH123',
    prisonId: 'LEI',
  })
  offendersService.getOffenceHistory.mockResolvedValue({})
  offendersService.getPrisonerBackground.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
  riskProfilerService.getSecurityProfile.mockResolvedValue({})
  riskProfilerService.getViolenceProfile.mockResolvedValue({})
  pathfinderService.getExtremismProfile.mockResolvedValue({})
  alertService.getEscapeProfile.mockResolvedValue({})
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
  moment.now = jest.fn()
  // NOTE: mock current date!
  moment.now.mockReturnValue(moment('2019-06-05', 'YYYY-MM-DD'))
})

afterEach(() => {
  jest.resetAllMocks()
  userService.getUser.mockReset()
})

describe('recat', () => {
  test.each`
    path                          | expectedContent
    ${'higherSecurityReview'}     | ${'Higher Security Review'}
    ${'miniHigherSecurityReview'} | ${'Higher Security Review'}
    ${'riskAssessment'}           | ${'Risk assessment'}
  `('Get should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      }),
  )

  describe('GET /form/recat/securityInput', () => {
    test.each`
      path                     | expectedContent
      ${'securityInput/12345'} | ${'Security information'}
    `('should render $expectedContent for $path', ({ path, expectedContent }) =>
      request(app)
        .get(`/${path}`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(expectedContent)
          expect(riskProfilerService.getSecurityProfile).toBeCalledTimes(0)
        }),
    )
    test('categoriser cannot edit security page if page is locked - redirect to tasklist)', () => {
      formService.getCategorisationRecord.mockResolvedValue({
        status: 'SECURITY_MANUAL',
        bookingId: 12345,
        displayName: 'Tim Handle',
        displayStatus: 'Any other status',
        formObject: {},
      })
      return request(app).get('/securityInput/12345').expect(302).expect('Location', `/tasklistRecat/12345`)
    })
  })

  test.each`
    formName                      | userInput                  | nextPath
    ${'securityInput'}            | ${{ dummy: 'No' }}         | ${'/tasklistRecat/'}
    ${'higherSecurityReview'}     | ${{ transfer: 'No' }}      | ${'/tasklistRecat/'}
    ${'miniHigherSecurityReview'} | ${{ transfer: 'No' }}      | ${'/tasklistRecat/'}
    ${'riskAssessment'}           | ${{ otherRelevant: 'No' }} | ${'/tasklistRecat/'}
    ${'oasysInput'}               | ${{ dummy: 'No' }}         | ${'/tasklistRecat/'}
  `('Post $formName should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: {},
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.recat[formName],
          userInput,
          formSection: 'recat',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test('Get category decision for male offender 21 or over)', () => {
    mockMalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('catBOption')
        expect(res.text).toContain('catCOption')
        expect(res.text).toContain('catDOption')
        expect(res.text).not.toContain('catIOption')
        expect(res.text).not.toContain('catROption')
        expect(res.text).not.toContain('catTOption')
        expect(res.text).not.toContain('Prisoner has an indeterminate sentence')
      })
  })

  test('Get category decision for male offender under 21)', () => {
    mockMalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('catIOption')
        expect(res.text).toContain('catJOption')
        expect(res.text).toContain('catBOption')
        expect(res.text).toContain('catCOption')
        expect(res.text).toContain('catDOption')
        expect(res.text).not.toContain('openOption')
        expect(res.text).not.toContain('closedOption')
        expect(res.text).not.toContain('Prisoner has an indeterminate sentence')
      })
  })

  test('Get category decision for female offender 21 and over)', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('openOption')
        expect(res.text).toContain('closedOption')
        expect(res.text).not.toContain('catIOption')
        expect(res.text).not.toContain('catJOption')
        expect(res.text).not.toContain('catBOption')
        expect(res.text).not.toContain('catCOption')
        expect(res.text).not.toContain('catDOption')
        expect(res.text).not.toContain('Prisoner has an indeterminate sentence')
      })
  })

  test('Get category decision for female offender under 21)', () => {
    mockFemalePrison()
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('catIOption')
        expect(res.text).toContain('catJOption')
        expect(res.text).toContain('openOption')
        expect(res.text).toContain('closedOption')
        expect(res.text).not.toContain('catBOption')
        expect(res.text).not.toContain('catCOption')
        expect(res.text).not.toContain('catDOption')
        expect(res.text).not.toContain('Prisoner has an indeterminate sentence')
      })
  })

  test('Category decision should present open conditions options for indeterminate sentences)', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    mockMalePrison()
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('catBOption')
        expect(res.text).toContain('catCOption')
        expect(res.text).toContain('catDOption')
        expect(res.text).not.toContain('openOption')
        expect(res.text).not.toContain('closedOption')
        expect(res.text).not.toContain('catIOption')
        expect(res.text).not.toContain('catJOption')
        expect(res.text).not.toContain('openOption')
      })
  })

  test('GET /form/recat/prisonerBackground', () =>
    request(app)
      .get(`/prisonerBackground/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('extremismInfo')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain('escapeInfo')
        expect(res.text).toContain('/prisoner/GH123/case-notes')
        expect(res.text).toContain('/prisoner/GH123/alerts')
        expect(res.text).toContain('/prisoner/GH123/adjudications')
        expect(res.text).toContain('/categoryHistory/12345')
      }))

  test('GET /form/recat/review violence profile - displayAssault', () => {
    riskProfilerService.getViolenceProfile.mockResolvedValue({
      nomsId: '1234AN',
      riskType: 'VIOLENCE',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: false,
      displayAssaults: true,
      numberOfAssaults: 5,
      numberOfSeriousAssaults: 2,
      numberOfNonSeriousAssaults: 4,
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(
          /This person has been reported as the perpetrator in 5 assaults in custody before,\s+including 2 serious assaults and 4 non-serious assaults in the past 12 months./,
        )
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard.+Category task list/s)
      })
  })

  test('GET /form/recat/review violence profile - all fine', () => {
    riskProfilerService.getViolenceProfile.mockReturnValue({
      nomsId: '1234AN',
      riskType: 'VIOLENCE',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: false,
      displayAssaults: false,
      numberOfAssaults: 5,
      numberOfSeriousAssaults: 2,
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('This person has been reported as the perpetrator')
        expect(res.text).toContain(
          'This person has not been reported as the perpetrator in any assaults in custody before',
        )
      })
  })

  test('GET /form/recat/review extremism profile - increasedRiskOfExtremism', () => {
    pathfinderService.getExtremismProfile.mockReturnValue({
      increasedRiskOfExtremism: true,
      notifyRegionalCTLead: true,
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person is at risk of engaging in, or vulnerable to, extremism.')
        expect(res.text).not.toContain(
          'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
        )
      })
  })

  test('GET /form/recat/review extremism profile - all fine', () => {
    pathfinderService.getExtremismProfile.mockReturnValue({
      increasedRiskOfExtremism: false,
      notifyRegionalCTLead: false,
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('This person is at risk of engaging in, or vulnerable to, extremism.')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain(
          'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
        )
      })
  })

  test('GET /form/recat/review higherSecurityReview link is displayed', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12345,
      formObject: { recat: { higherSecurityReview: { behaviour: 'good' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({ bookingId: '12345' })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/higherSecurityReview/12345')
        expect(res.text).not.toContain('/miniHigherSecurityReview/12345')
      })
  })

  test('GET /form/recat/review miniHigherSecurityReview link is displayed', () => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12345,
      formObject: { recat: { miniHigherSecurityReview: { conditions: 'text' } } },
    })
    offendersService.getOffenderDetails.mockResolvedValue({ bookingId: '12345' })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/miniHigherSecurityReview/12345')
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).not.toContain('/higherSecurityReview/12345')
      })
  })
})

describe('GET /riskProfileChangeDetail/:bookingId', () => {
  test('happy path sections are displayed', () => {
    offendersService.getRiskChangeForOffender.mockResolvedValue({
      socNewlyReferred: true,
      escapeList: true,
      violenceChange: true,
      bookingId: 12345,
      newProfile: {
        violence: {
          numberOfSeriousAssaults: 1,
          numberOfNonSeriousAssaults: 2,
          numberOfAssaults: 4,
          provisionalCategorisation: 'C',
        },
      },
      oldProfile: { violence: { numberOfSeriousAssaults: 0, numberOfAssaults: 0, provisionalCategorisation: 'B' } },
    })
    return request(app)
      .get(`/riskProfileChangeDetail/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toMatch(/Digital Prison Services.+Categorisation dashboard/s)
        expect(res.text).toContain(
          'This person needs to be considered by security. Please start a review and refer this person to security.',
        )
        expect(res.text).toContain('Notify your safer custody lead about this prisoner')
        expect(res.text).toContain('This person is now considered a risk of escape')
        expect(res.text).toMatch(
          /They have been reported as the perpetrator of 4 assaults in custody before,\s+including 1 serious assaults and 2 non-serious assaults in the past 12 months/,
        )
        expect(res.text).toContain('There are no reported assaults during this sentence')
        expect(res.text).toContain('Do you want to start an early category review?')
      })
  })

  test('Assaults wording', () => {
    offendersService.getRiskChangeForOffender.mockResolvedValue({
      violenceChange: true,
      bookingId: 12345,
      newProfile: { violence: { numberOfSeriousAssaults: 3, numberOfNonSeriousAssaults: 2, numberOfAssaults: 7 } },
      oldProfile: { violence: { numberOfSeriousAssaults: 0, numberOfNonSeriousAssaults: 5, numberOfAssaults: 6 } },
    })
    return request(app)
      .get(`/riskProfileChangeDetail/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Risk of escape')
        expect(res.text).not.toContain('Security referral')
        expect(res.text).toMatch(
          /They have been reported as the perpetrator of 7 assaults in custody before,\s+including 3 serious assaults and 2 non-serious assaults in the past 12 months/,
        )
        expect(res.text).toMatch(
          /They have been reported as the perpetrator of 6 assaults in custody before,\s+including 0 serious assaults and 5 non-serious assaults in the past 12 months/,
        )
      })
  })

  test('Assaults wording - 1 serious assault', () => {
    offendersService.getRiskChangeForOffender.mockResolvedValue({
      violenceChange: true,
      bookingId: 12345,
      newProfile: { violence: { numberOfSeriousAssaults: 1, numberOfNonSeriousAssaults: 2, numberOfAssaults: 3 } },
      oldProfile: { violence: { numberOfSeriousAssaults: 1, numberOfNonSeriousAssaults: 4, numberOfAssaults: 5 } },
    })
    return request(app)
      .get(`/riskProfileChangeDetail/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Risk of escape')
        expect(res.text).not.toContain('Security referral')
        expect(res.text).toMatch(
          /They have been reported as the perpetrator of 3 assaults in custody before,\s+including 1 serious assaults and 2 non-serious assaults in the past 12 months/,
        )
        expect(res.text).toMatch(
          /They have been reported as the perpetrator of 5 assaults in custody before,\s+including 1 serious assaults and 4 non-serious assaults in the past 12 months/,
        )
      })
  })

  test('No violence change', () => {
    offendersService.getRiskChangeForOffender.mockResolvedValue({
      violenceChange: false,
      bookingId: 12345,
    })
    return request(app)
      .get(`/riskProfileChangeDetail/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Risk of escape')
        expect(res.text).not.toContain('Safety and good order')
        expect(res.text).not.toContain('Security referral')
      })
  })
})

describe('POST /form/recat/decision', () => {
  test.each`
    formName      | userInput                                  | nextPath
    ${'decision'} | ${{ currentCategory: 'I', category: 'B' }} | ${'/form/recat/miniHigherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'I' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'C' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'J', category: 'B' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'C' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'B' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'C' }} | ${'/form/recat/higherSecurityReview/12345'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'C' }} | ${'/tasklistRecat/12345'}
    ${'decision'} | ${{ currentCategory: 'D', category: 'D' }} | ${'/openConditionsAdded/12345?catType=RECAT'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'J' }} | ${'/openConditionsAdded/12345?catType=RECAT'}
    ${'decision'} | ${{ currentCategory: 'I', category: 'I' }} | ${'/tasklistRecat/12345'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'D' }} | ${'/openConditionsAdded/12345?catType=RECAT'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'C' }} | ${'/tasklistRecat/12345'}
    ${'decision'} | ${{ currentCategory: 'B', category: 'B' }} | ${'/tasklistRecat/12345'}
    ${'decision'} | ${{ currentCategory: 'C', category: 'C' }} | ${'/tasklistRecat/12345'}
  `('Post for input $userInput should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12345,
      displayName: 'Tim Handle',
      displayStatus: 'Any other status',
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.recat[formName],
          userInput,
          formSection: 'recat',
          formName,
          transactionalClient: mockTransactionalClient,
        })
        expect(userService.getUser).toBeCalledTimes(1)
      })
  })
})

describe('POST /form/recat/review', () => {
  test.each`
    formName    | userInput | nextPath
    ${'review'} | ${{}}     | ${'/tasklistRecat/recategoriserSubmitted/'}
  `('Post for $sectionName/$formName, input $userInput should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      status: 'STARTED',
      bookingId: 12345,
      formObject: { recat: { decision: { category: 'B' }, nextReviewDate: { date: '16/02/2020' } } },
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `${nextPath}12345`)
      .expect(() => {
        expect(formService.update).toBeCalledTimes(0)
        expect(offendersService.createOrUpdateCategorisation).toBeCalledWith({
          context: {
            featureFlags: makeTestFeatureFlagDto(),
            user: { token: 'ABCDEF', username: 'me' },
          },
          bookingId: 12345,
          overriddenCategoryText: 'Cat-tool Recat',
          suggestedCategory: 'B',
          nextReviewDate: '16/02/2020',
          transactionalDbClient: mockTransactionalClient,
        })
        expect(formService.categoriserDecision).toBeCalledWith('12345', 'CA_USER_TEST', mockTransactionalClient)
      })
  })
})

describe('Testing oasys input page routing', () => {
  test.each`
    path                  | expectedContent
    ${'oasysInput/12345'} | ${'Offender Assessment System (OASys)'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      }),
  )
  test('Oasys Validation error redirect to page', () => {
    request(app).post(`/oasysInput/866018`).expect(302).expect('Location', 'form/recat/oasysInput/866018')
  })
})
