const request = require('supertest')
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
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createInitialCategorisation: jest.fn(),
  getPrisonerBackground: jest.fn(),
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
  roles = ['ROLE_CREATE_RECATEGORISATION']
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.isYoungOffender.mockReturnValue(false)
  formService.deleteFormData.mockReturnValue({})
  formService.recordNomisSeqNumber.mockReturnValue({})
  formService.categoriserDecision.mockReturnValue({})
  offendersService.createInitialCategorisation.mockReturnValue({ bookingId: 12, seq: 4 })
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent' })
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  offendersService.getPrisonerBackground.mockResolvedValue({})
  userService.getUser.mockResolvedValue({})
  riskProfilerService.getSecurityProfile.mockResolvedValue({})
  riskProfilerService.getViolenceProfile.mockResolvedValue({})
  riskProfilerService.getExtremismProfile.mockResolvedValue({})
  riskProfilerService.getEscapeProfile.mockResolvedValue({})
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  formService.getCategorisationRecord.mockReset()
  formService.referToSecurityIfRiskAssessed.mockReset()
  formService.referToSecurityIfRequested.mockReset()
  formService.update.mockReset()
  formService.getValidationErrors.mockReset()
  formService.computeSuggestedCat.mockReset()
  formService.updateFormData.mockReset()
  formService.isYoungOffender.mockReset()
  formService.mergeRiskProfileData.mockReset()
  formService.backToCategoriser.mockReset()
  formService.isValid.mockReset()
  formService.deleteFormData.mockReset()
  offendersService.getOffenderDetails.mockReset()
  offendersService.getCatAInformation.mockReset()
  offendersService.getOffenceHistory.mockReset()
  userService.getUser.mockReset()
  riskProfilerService.getSecurityProfile.mockReset()
  riskProfilerService.getViolenceProfile.mockReset()
  riskProfilerService.getExtremismProfile.mockReset()
  riskProfilerService.getEscapeProfile.mockReset()
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
      })
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
        })
    )
    test('categoriser cannot edit security page if page is locked - redirect to tasklist)', () => {
      formService.getCategorisationRecord.mockResolvedValue({
        status: 'SECURITY_MANUAL',
        bookingId: 12,
        displayName: 'Tim Handle',
        displayStatus: 'Any other status',
      })
      return request(app)
        .get('/securityInput/12345')
        .expect(302)
        .expect('Location', `/tasklistRecat/12345`)
    })
  })

  test.each`
    formName                      | userInput                  | nextPath
    ${'securityInput'}            | ${{ dummy: 'No' }}         | ${'/tasklistRecat/'}
    ${'higherSecurityReview'}     | ${{ transfer: 'No' }}      | ${'/tasklistRecat/'}
    ${'miniHigherSecurityReview'} | ${{ transfer: 'No' }}      | ${'/tasklistRecat/'}
    ${'riskAssessment'}           | ${{ otherRelevant: 'No' }} | ${'/tasklistRecat/'}
    ${'nextReviewDate'}           | ${{ date: '23/05/2025' }}  | ${'/tasklistRecat/'}
  `('Post $formName should go to $nextPath', ({ formName, userInput, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
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

  test('Get category decision for offender 21 or over)', () => {
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).not.toContain('catIOption')
      })
  })

  test('Get category decision for offender under 21)', () => {
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Category decision')
        expect(res.text).toContain('catIOption')
        expect(res.text).not.toContain('Prisoner has an indeterminate sentence')
      })
  })

  test('Category decision should not present open conditions options for indeterminate sentences)', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    formService.isYoungOffender.mockReturnValue(false)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('catBOption')
        expect(res.text).toContain('catCOption')
        expect(res.text).not.toContain('catIOption')
        expect(res.text).not.toContain('catJOption')
        expect(res.text).not.toContain('catDOption')
      })
  })

  test('Category decision should not present open conditions options for indeterminate sentences (young offender)', () => {
    offendersService.getOffenderDetails.mockResolvedValue({
      sentence: { indeterminate: true },
    })
    formService.isYoungOffender.mockReturnValue(true)
    return request(app)
      .get(`/decision/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('catBOption')
        expect(res.text).toContain('catCOption')
        expect(res.text).toContain('catIOption')
        expect(res.text).toContain('Prisoner has an indeterminate sentence')
        expect(res.text).not.toContain('catJOption')
        expect(res.text).not.toContain('catDOption')
      })
  })

  test('GET /form/recat/prisonerBackground', () =>
    request(app)
      .get(`/prisonerBackground/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('extremismInfo')
        expect(res.text).toContain('escapeInfo')
        expect(res.text).toContain('violenceInfo')
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
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This person has been reported as the perpetrator in 5 assaults in custody before,')
        expect(res.text).toContain('including 2 serious assaults in the last 12 months')
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
          'This person has not been reported as the perpetrator in any assaults in custody before'
        )
      })
  })

  test('GET /form/recat/review extremism profile - increasedRiskOfExtremism', () => {
    riskProfilerService.getExtremismProfile.mockReturnValue({
      nomsId: '123AD',
      riskType: 'EXTREMISM',
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
          'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.'
        )
      })
  })

  test('GET /form/recat/review extremism profile - all fine', () => {
    riskProfilerService.getExtremismProfile.mockReturnValue({
      nomsId: '123AD',
      riskType: 'EXTREMISM',
      increasedRiskOfExtremism: false,
      notifyRegionalCTLead: false,
    })
    return request(app)
      .get(`/review/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('This person is at risk of engaging in, or vulnerable to, extremism.')
        expect(res.text).toContain(
          'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.'
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
        expect(res.text).not.toContain('/higherSecurityReview/12345')
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
      bookingId: 12,
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
        expect(offendersService.createInitialCategorisation).toBeCalledWith({
          token: 'ABCDEF',
          bookingId: 12345,
          overriddenCategoryText: 'Cat-tool Recat',
          suggestedCategory: 'B',
          nextReviewDate: '16/02/2020',
        })
        expect(formService.categoriserDecision).toBeCalledWith('12345', 'CA_USER_TEST', mockTransactionalClient)
      })
  })
})
