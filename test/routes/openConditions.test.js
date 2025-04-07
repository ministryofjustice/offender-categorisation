const request = require('supertest')
const appSetup = require('./utils/appSetup')
const { authenticationMiddleware } = require('./utils/mockAuthentication')
const db = require('../../server/data/dataAccess/db')

const ratings = require('../../server/config/ratings')
const supervisor = require('../../server/config/supervisor')
const categoriser = require('../../server/config/categoriser')
const security = require('../../server/config/security')
const openConditions = require('../../server/config/openConditions')

const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }

let roles
// This needs mocking early, before 'requiring' jwt-decode (via home.js)
jest.doMock('jwt-decode', () => jest.fn(() => ({ authorities: roles })))

const createRouter = require('../../server/routes/openConditions')

const formConfig = {
  ratings,
  categoriser,
  supervisor,
  security,
  openConditions,
}

const formService = {
  getCategorisationRecord: jest.fn(),
  referToSecurityIfRiskAssessed: jest.fn(),
  referToSecurityIfRequested: jest.fn(),
  isYoungOffender: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  computeSuggestedCat: jest.fn().mockReturnValue('B'),
  updateFormData: jest.fn(),
  mergeRiskProfileData: jest.fn(),
  backToCategoriser: jest.fn(),
  isValid: jest.fn(),
  cancelOpenConditions: jest.fn(),
}

const offendersService = {
  getUncategorisedOffenders: jest.fn(),
  getOffenderDetails: jest.fn(),
  getImage: jest.fn(),
  getCatAInformation: jest.fn(),
  getOffenceHistory: jest.fn(),
  createSupervisorApproval: jest.fn(),
  createOrUpdateCategorisation: jest.fn(),
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
  roles = ['ROLE_CREATE_CATEGORISATION']
  formService.getCategorisationRecord.mockResolvedValue({})
  formService.referToSecurityIfRiskAssessed.mockResolvedValue({})
  formService.referToSecurityIfRequested.mockResolvedValue({})
  formService.isValid.mockResolvedValue(true)
  formService.isYoungOffender.mockReturnValue(false)
  offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent' })
  offendersService.getCatAInformation.mockResolvedValue({})
  offendersService.getOffenceHistory.mockResolvedValue({})
  userService.getUser.mockResolvedValue({
    activeCaseLoad: {
      caseLoadId: 'MDI',
      description: 'Moorland (HMP & YOI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: true,
      female: false,
    },
  })
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('open conditions', () => {
  test.each`
    path                     | expectedContent
    ${'tprs'}                | ${'Is this prisoner eligible for the Temporary Presumptive Recategorisation Scheme (TPRS)?'}
    ${'earliestReleaseDate'} | ${'Earliest release date'}
    ${'previousSentences'}   | ${'Previous sentences'}
    ${'victimContactScheme'} | ${'Victim Contact Scheme'}
    ${'foreignNational'}     | ${'Foreign national'}
    ${'riskOfHarm'}          | ${'Risk of serious harm'}
    ${'riskLevels'}          | ${'Risk of escaping or absconding'}
  `('should render $expectedContent for $path', ({ path, expectedContent }) =>
    request(app)
      .get(`/${path}/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      }),
  )

  test('INITIAL categorisation in a mens prison where further charges and open conditions further charges are both yes', () => {
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
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'old stuff' } },
        openConditions: {
          furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).toContain('name="furtherCharges" value="Yes"')
        expect(res.text).not.toContain('name="furtherCharges" type="radio" value="Yes"')
        expect(res.text).toContain('new stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('INITIAL categorisation in a mens prison where further charges is yes and open conditions further charges is no', () => {
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
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'old stuff' } },
        openConditions: { furtherCharges: { furtherCharges: 'No', increasedRisk: 'No' } },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).toContain('name="furtherCharges" value="Yes"')
        expect(res.text).not.toContain('name="furtherCharges" type="radio" value="No"')
        expect(res.text).toContain('old stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('INITIAL categorisation in a mens prison where no further charges and but open conditions furtherChargesText exist', () => {
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
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'No' } },
        openConditions: {
          furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="Yes" checked')
        expect(res.text).toContain('new stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('INITIAL categorisation in a mens prison where furtherCharges is no and open conditions further charges is no', () => {
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
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        ratings: { furtherCharges: { furtherCharges: 'No' } },
        openConditions: {
          furtherCharges: { furtherCharges: 'No', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).not.toContain('name="furtherCharges" value="No"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="No" checked')
        expect(res.text).toContain('new stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('INITIAL categorisation in a womens prison where only open conditions further charges exist', () => {
    offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: {
          furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'new stuff', increasedRisk: 'No' },
        },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="Yes" checked')
        expect(res.text).toContain('new stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('INITIAL categorisation in a womens prison where no open conditions furtherChargesText exist', () => {
    offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: { furtherCharges: { furtherCharges: 'No' } },
      },
      catType: 'INITIAL',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="INITIAL"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="No" checked')
      })
  })

  test('RECAT categorisation in a mens prison where open conditions further charges is yes', () => {
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
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: {
          furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'some stuff', increasedRisk: 'No' },
        },
      },
      catType: 'RECAT',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="RECAT"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="Yes" checked')
        expect(res.text).toContain('some stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test('RECAT categorisation in a womens prison where no open conditions further charges', () => {
    offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: { furtherCharges: { furtherCharges: 'No' } },
      },
      catType: 'RECAT',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="RECAT"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="No" checked')
      })
  })

  test('RECAT categorisation in a womens prison where open conditions further charges is yes', () => {
    offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {
        openConditions: {
          furtherCharges: { furtherCharges: 'Yes', furtherChargesText: 'some stuff', increasedRisk: 'No' },
        },
      },
      catType: 'RECAT',
    })
    return request(app)
      .get('/furtherCharges/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('name="catType" value="RECAT"')
        expect(res.text).not.toContain('name="furtherCharges" value="Yes"')
        expect(res.text).toContain('name="furtherCharges" type="radio" value="Yes" checked')
        expect(res.text).toContain('some stuff')
        expect(res.text).toContain('id="increasedRisk-2" name="increasedRisk" type="radio" value="No" checked')
      })
  })

  test.each`
    formName                 | userInput                                                                                     | updateInfo                                                        | nextPath
    ${'tprs'}                | ${{ tprsSelected: 'No' }}                                                                     | ${{ tprsSelected: 'No' }}                                         | ${'/form/openConditions/earliestReleaseDate/12345'}
    ${'earliestReleaseDate'} | ${{ catType: 'RECAT', fiveOrMoreYears: 'No', justify: 'Yes', justifyText: 'text' }}           | ${{ catType: 'RECAT', fiveOrMoreYears: 'No' }}                    | ${'/form/openConditions/victimContactScheme/12345'}
    ${'earliestReleaseDate'} | ${{ catType: 'INITIAL', fiveOrMoreYears: 'No', justify: 'Yes', justifyText: 'text' }}         | ${{ catType: 'INITIAL', fiveOrMoreYears: 'No' }}                  | ${'/form/openConditions/previousSentences/12345'}
    ${'victimContactScheme'} | ${{ catType: 'RECAT', vcsOptedFor: 'No' }}                                                    | ${{ catType: 'RECAT', vcsOptedFor: 'No' }}                        | ${'/form/openConditions/foreignNational/12345'}
    ${'previousSentences'}   | ${{ catType: 'INITIAL', releasedLastFiveYears: 'No', sevenOrMoreYears: 'No' }}                | ${{ catType: 'INITIAL', releasedLastFiveYears: 'No' }}            | ${'/form/openConditions/victimContactScheme/12345'}
    ${'victimContactScheme'} | ${{ catType: 'INITIAL', vcsOptedFor: 'No' }}                                                  | ${{ catType: 'INITIAL', vcsOptedFor: 'No' }}                      | ${'/form/openConditions/sexualOffences/12345'}
    ${'foreignNational'}     | ${{ isForeignNational: 'No', dueDeported: 'Yes', formCompleted: 'Yes', exhaustedAppeal: '' }} | ${{ isForeignNational: 'No' }}                                    | ${'/form/openConditions/riskOfHarm/12345'}
    ${'riskOfHarm'}          | ${{ seriousHarm: 'No', harmManaged: 'Yes', harmManagedText: '' }}                             | ${{ seriousHarm: 'No' }}                                          | ${'/form/openConditions/furtherCharges/12345'}
    ${'furtherCharges'}      | ${{}}                                                                                         | ${{}}                                                             | ${'/form/openConditions/riskLevels/12345'}
    ${'riskLevels'}          | ${{ catType: 'INITIAL' }}                                                                     | ${{ catType: 'INITIAL' }}                                         | ${'/tasklist/12345'}
    ${'riskLevels'}          | ${{ catType: 'RECAT' }}                                                                       | ${{ catType: 'RECAT' }}                                           | ${'/tasklistRecat/12345'}
    ${'victimContactScheme'} | ${{ catType: 'INITIAL', vcsOptedFor: 'Yes', contactedVLO: 'No' }}                             | ${{ catType: 'INITIAL', vcsOptedFor: 'Yes', contactedVLO: 'No' }} | ${'/form/openConditions/openConditionsNotSuitable/12345?reason=VICTIM_CONTACT_SCHEME'}
    ${'victimContactScheme'} | ${{ catType: 'RECAT', vcsOptedFor: 'Yes', contactedVLO: 'No' }}                               | ${{ catType: 'RECAT', vcsOptedFor: 'Yes', contactedVLO: 'No' }}   | ${'/form/openConditions/openConditionsNotSuitable/12345?reason=VICTIM_CONTACT_SCHEME'}
  `('Post $formName for $userInput.catType should go to $nextPath', ({ formName, userInput, updateInfo, nextPath }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: {},
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', nextPath)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.openConditions[formName],
          userInput: updateInfo,
          formSection: 'openConditions',
          formName,
          transactionalClient: mockTransactionalClient,
        })
      })
  })

  test.each`
    formName                 | userInput                                                    | queryParam
    ${'earliestReleaseDate'} | ${{ fiveOrMoreYears: 'Yes', justify: 'No' }}                 | ${'EARLIEST_RELEASE_DATE'}
    ${'previousSentences'}   | ${{ releasedLastFiveYears: 'Yes', sevenOrMoreYears: 'Yes' }} | ${'PREVIOUS_SENTENCES'}
    ${'foreignNational'}     | ${{ formCompleted: 'No' }}                                   | ${'FOREIGN_NATIONAL_FORM'}
    ${'foreignNational'}     | ${{ exhaustedAppeal: 'Yes' }}                                | ${'FOREIGN_NATIONAL_EXHAUSTED_APPEALS'}
  `('should render openConditionsNotSuitable page for $formName', ({ formName, userInput, queryParam }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: userInput,
    })
    return request(app)
      .post(`/${formName}/12345`)
      .send(userInput)
      .expect(302)
      .expect('Location', `/form/openConditions/openConditionsNotSuitable/12345?reason=${queryParam}`)
      .expect(() => {
        expect(formService.update).toBeCalledWith({
          bookingId: 12345,
          userId: 'CA_USER_TEST',
          config: formConfig.openConditions[formName],
          userInput,
          formSection: 'openConditions',
          formName,
          transactionalClient: mockTransactionalClient,
        })
        expect(formService.cancelOpenConditions).toBeCalledWith(12345, 'CA_USER_TEST', mockTransactionalClient)
      })
  })

  test.each`
    data                                                                                                       | expectedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'No' } } }}                                               | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'Yes' } } }}                                        | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'Yes' } } }}                                          | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'No' } } }} | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open conditions'}
  `('should render notRecommended page with expected content: $expectedContent', ({ data, expectedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: data,
    })
    return request(app)
      .get(`/notRecommended/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(expectedContent)
      })
  })

  test.each`
    data                                                                                                        | notRecommendedContent
    ${{ openConditions: { riskOfHarm: { harmManaged: 'Yes' } } }}                                               | ${'They pose a risk of serious harm to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { furtherCharges: { increasedRisk: 'No' } } }}                                          | ${'They have further charges which pose an increased risk in open conditions'}
    ${{ openConditions: { riskLevels: { likelyToAbscond: 'No' } } }}                                            | ${'They are likely to abscond or otherwise abuse the lower security of open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'Yes', canTheRiskBeManaged: 'Yes' } } }} | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open conditions'}
    ${{ openConditions: { sexualOffences: { haveTheyBeenEverConvicted: 'No' } } }}                              | ${'They have been convicted of a sexual offence and pose a risk to the public which cannot be safely managed in open'}
  `('notRecommended page should not contain content: $notRecommendedContent', ({ data, notRecommendedContent }) => {
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12345,
      formObject: data,
    })
    return request(app)
      .get(`/notRecommended/12345`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(notRecommendedContent)
      })
  })

  test('should redirect from notRecommended page to provisionalCategory', () =>
    request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'Yes', catType: 'INITIAL' })
      .expect(302)
      .expect('Location', `/tasklist/12345`))

  test('should redirect from notRecommended page to categoriser', () => {
    roles = ['ROLE_CREATE_CATEGORISATION']
    formService.getCategorisationRecord.mockResolvedValue({
      bookingId: 12,
      formObject: { categoriser: {} },
    })

    return request(app)
      .post(`/notRecommended/12345`)
      .send({ stillRefer: 'No', catType: 'RECAT' })
      .expect(302)
      .expect('Location', `/tasklistRecat/12345`)
  })

  test('Should have D for openConditionsSuggestedCategory for male prison', () => {
    return request(app)
      .get('/provisionalCategory/12345')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`<input type="hidden" name="openConditionsSuggestedCategory" value="D"/>`)
      })
  })

  test('Should have T for openConditionsSuggestedCategory value if female', () => {
    offendersService.getOffenderDetails.mockResolvedValue({ displayName: 'Claire Dent', prisonId: 'PFI' })
    return request(app).get('/provisionalCategory/12345').expect(302).expect('Location', `/tasklist/12345`)
  })
})
