import moment from 'moment/moment'
import { RECATEGORISER_USER } from '../../factory/user'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import Page from '../../pages/page'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import DecisionPage from '../../pages/form/recat/decision/decisionPage'
import OpenConditionsAdded from '../../pages/openConditionsAdded'
import TprsPage from '../../pages/form/openConditions/tprs'
import EarliestReleaseDatePage from '../../pages/form/openConditions/earliestReleaseDate'
import VictimContactSchemePage from '../../pages/form/openConditions/victimContactScheme'
import ForeignNationalPage from '../../pages/form/openConditions/foreignNational'
import RiskOfSeriousHarmPage from '../../pages/form/openConditions/riskOfSeriousHarm'
import FurtherChargesPage from '../../pages/form/openConditions/furtherCharges'
import RiskLevelsPage from '../../pages/form/openConditions/riskLevels'
import OpenConditionsNotRecommended from '../../pages/form/openConditions/notRecommendedPage'
import { compareObjects, isToday } from '../../support/utilities'
import ReviewRecatPage from '../../pages/form/recat/reviewRecatPage'

describe('Open Conditions', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  it('The happy path is correct for recategoriser setting cat D, all yeses, then cancelling open conditions', () => {
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 1,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
    })

    sentenceStartDates = {
      B2345XY: new Date('2019-01-28'),
      B2345YZ: new Date('2019-01-31'),
    }

    // when: 'The categoriser sets cat D'
    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubGetSocProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      increasedRisk: true,
      notifyRegionalCTLead: false,
    })
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      onEscapeList: true,
      activeOnEscapeList: true,
    })
    cy.task('stubGetViolenceProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      veryHighRiskViolentOffender: true,
      notifySafetyCustodyLead: true,
      displayAssaults: false,
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.decisionButton().click()

    // Decision page
    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.catDOption().click()
    decisionPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(12).click()

    // 'the tasklist recat page is displayed with open conditions section added'
    tasklistRecatPage.openConditionsButton().should('exist')

    // 'open conditions task is selected'
    tasklistRecatPage.openConditionsButton().click()
    const tprsPage = Page.verifyOnPage(TprsPage)

    // 'the TPRS page is displayed'
    tprsPage.selectTprsRadioButton('YES')
    tprsPage.continueButton().click()

    // 'the Earliest Release page is displayed'
    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.selectEarliestReleaseDateRadioButton('YES')
    earliestReleasePage.selectJustifyRadioButton('YES')
    earliestReleasePage.setJustifyOpenConditionsTextInput('justify details text')
    earliestReleasePage.continueButton().click()

    //  'the Victim Contact Scheme page is displayed'
    const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemaPage.selectVictimContactSchemeRadioButton('YES')
    victimContactSchemaPage.selectContactedVictimLiaisonOfficerRadioButton('YES')
    victimContactSchemaPage.setVictimLiaisonOfficerResponseTextInput('vlo response text')
    victimContactSchemaPage.continueButton().click()

    // 'the Foreign National page is displayed'
    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.selectForeignNationalRadioButton('YES')
    foreignNationalPage.selectHomeOfficeImmigrationStatusRadioButton('YES')
    foreignNationalPage.selectLiabilityToBeDeportedRadioButton('YES')
    foreignNationalPage.selectExhaustedAppealRadioButton('NO')
    foreignNationalPage.continueButton().click()

    // 'the Risk of serious harm page is displayed'
    const riskOfHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfHarmPage.selectRiskOfSeriousHarmRadioButton('YES')
    riskOfHarmPage.selectManageInOpenConditionsRadioButton('YES')
    riskOfHarmPage.setManageRiskTextInput('harmManagedText details')
    riskOfHarmPage.continueButton().click()

    // 'the Further Charges page is displayed'
    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.selectFurtherChargesRadioButton('YES')
    furtherChargesPage.setFurtherChargeDetailsTextInput(',furtherChargesText details')
    furtherChargesPage.selectIncreasedRiskRadioButton('YES')
    furtherChargesPage.continueButton().click()

    // 'the Risk of escaping or absconding page is displayed'
    const riskOfEscapingOrAbscondingPage = Page.verifyOnPage(RiskLevelsPage)
    riskOfEscapingOrAbscondingPage.selectRiskLevelsRadioButton('YES')
    riskOfEscapingOrAbscondingPage.setLikelyToAbscondTextInput('likelyToAbscondText details')
    riskOfEscapingOrAbscondingPage.continueButton().click()

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      cy.log('Check the prisoner data before changing category, should retain "open conditions" info')
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'D' },
            oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
            securityInput: { securityNoteNeeded: 'No', securityInputNeeded: 'Yes' },
            nextReviewDate: { date: '14/12/2019' },
            riskAssessment: {
              lowerCategory: 'lower security category text',
              otherRelevant: 'Yes',
              higherCategory: 'higher security category text',
              otherRelevantText: 'other relevant information',
            },
            prisonerBackground: { offenceDetails: 'offence Details text' },
          },
          openConditions: {
            tprs: { tprsSelected: 'Yes' },
            riskLevels: { likelyToAbscond: 'Yes', likelyToAbscondText: 'likelyToAbscondText details' },
            riskOfHarm: { harmManaged: 'Yes', seriousHarm: 'Yes', harmManagedText: 'harmManagedText details' },
            furtherCharges: {
              increasedRisk: 'Yes',
              furtherCharges: 'Yes',
              furtherChargesText: ',furtherChargesText details',
            },
            foreignNational: {
              dueDeported: 'Yes',
              formCompleted: 'Yes',
              exhaustedAppeal: 'No',
              isForeignNational: 'Yes',
            },
            earliestReleaseDate: { justify: 'Yes', justifyText: 'justify details text', threeOrMoreYears: 'Yes' },
            victimContactScheme: { vcsOptedFor: 'Yes', contactedVLO: 'Yes', vloResponseText: 'vlo response text' },
          },
          openConditionsRequested: true,
        },
        booking_id: 12,
        user_id: null,
        status: 'STARTED',
        assigned_user_id: null,
        referred_date: null,
        referred_by: null,
        sequence_no: 1,
        risk_profile: {
          socProfile: { nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'C' },
          extremismProfile: {
            nomsId: 'B2345YZ',
            riskType: 'EXTREMISM',
            notifyRegionalCTLead: false,
            increasedRiskOfExtremism: true,
            provisionalCategorisation: 'C',
          },
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        start_date: '2024-12-17T11:33:02.878Z',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: 1,
        assessment_date: null,
        approved_by: null,
        assessed_by: null,
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }
      delete expected.start_date

      const assessmentStartedToday = isToday(dbRecord.start_date)
      cy.log('assessmentStartedToday matches', assessmentStartedToday)

      const dbRecordMatchesExpected = compareObjects(expected, dbRecord)
      cy.log('dbRecordMatchesExpected', dbRecordMatchesExpected)

      return dbRecordMatchesExpected && assessmentStartedToday
    })

    // 'I am diverted to the not recommended page'
    const openConditionsNotRecommendedPage = Page.verifyOnPage(OpenConditionsNotRecommended)
    openConditionsNotRecommendedPage.validateNotSuitableReasons([
      'They have further charges which pose an increased risk in open conditions',
      'They are likely to abscond or otherwise abuse the lower security of open conditions',
    ])
    openConditionsNotRecommendedPage.selectStillReferRadioButton('NO')
    openConditionsNotRecommendedPage.continueButton().click()

    // 'tasklist page is displayed without the open conditions section and the cat data is cleared'
    tasklistRecatPage.openConditionsButton().should('not.exist')

    // 'a new cat entered and the tasklistRecat continue button is clicked'
    tasklistRecatPage.decisionButton().click()

    decisionPage.catCOption().click()
    decisionPage.submitButton().click()

    tasklistRecatPage.checkAndSubmitButton(12).click()

    // 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    const reviewRecatPage = Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 6)
    reviewRecatPage.validateSecurityInputSummary([
      { question: 'Automatic referral to security team', expectedAnswer: 'No' },
      { question: 'Manual referral to security team', expectedAnswer: 'Yes' },
      { question: 'Flagged by security team', expectedAnswer: 'No' },
    ])
    reviewRecatPage.validateRiskAssessmentSummary([
      {
        question: 'Could they be managed in a lower security category?',
        expectedAnswer: 'lower security category text',
      },
      {
        question: 'Should they remain in their current security category? Or be put in a higher security category?',
        expectedAnswer: 'higher security category text',
      },
      { question: 'Other relevant information', expectedAnswer: 'Yes other relevant information' },
    ])
    reviewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category C' },
    ])
    reviewRecatPage.validateNextReviewDateSummary([
      { question: 'What date should they be reviewed by?', expectedAnswer: 'Saturday 14 December 2019' },
    ])
    reviewRecatPage.validateRiskOfHarmSummary([
      { question: 'Risk of serious harm to the public?', expectedAnswer: 'Yes' },
      { question: 'Can this risk be managed?', expectedAnswer: 'Yes harmManagedText details' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      cy.log('Check the prisoner data after changing category, should have removed "open conditions" info')
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'C' },
            oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
            securityInput: { securityNoteNeeded: 'No', securityInputNeeded: 'Yes' },
            nextReviewDate: { date: '14/12/2019' },
            riskAssessment: {
              lowerCategory: 'lower security category text',
              otherRelevant: 'Yes',
              higherCategory: 'higher security category text',
              otherRelevantText: 'other relevant information',
            },
            prisonerBackground: { offenceDetails: 'offence Details text' },
          },
          openConditions: {
            tprs: { tprsSelected: 'Yes' },
            riskLevels: { likelyToAbscond: 'Yes', likelyToAbscondText: 'likelyToAbscondText details' },
            riskOfHarm: { harmManaged: 'Yes', seriousHarm: 'Yes', harmManagedText: 'harmManagedText details' },
            furtherCharges: {
              increasedRisk: 'Yes',
              furtherCharges: 'Yes',
              furtherChargesText: ',furtherChargesText details',
            },
            notRecommended: { stillRefer: 'No' },
            foreignNational: {
              dueDeported: 'Yes',
              formCompleted: 'Yes',
              exhaustedAppeal: 'No',
              isForeignNational: 'Yes',
            },
            earliestReleaseDate: { justify: 'Yes', justifyText: 'justify details text', threeOrMoreYears: 'Yes' },
            victimContactScheme: { vcsOptedFor: 'Yes', contactedVLO: 'Yes', vloResponseText: 'vlo response text' },
          },
          openConditionsRequested: false,
        },
        booking_id: 12,
        user_id: null,
        status: 'STARTED',
        assigned_user_id: null,
        referred_date: null,
        referred_by: null,
        sequence_no: 1,
        risk_profile: {
          socProfile: { nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'C' },
          escapeProfile: {
            nomsId: 'B2345YZ',
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: true,
            escapeListAlerts: [
              {
                active: true,
                comment: 'First xel comment',
                expired: false,
                alertCode: 'XEL',
                dateCreated: '2016-09-14',
                alertCodeDescription: 'Escape List',
              },
              {
                active: false,
                comment:
                  '\nSecond xel comment with lengthy text comment with lengthy text comment with lengthy text comment with lengthy text\ncomment with lengthy text comment with lengthy text comment with lengthy text\ncomment with lengthy text comment with lengthy text comment with lengthy text\ncomment with lengthy text comment with lengthy text comment with lengthy text\n',
                expired: true,
                alertCode: 'XEL',
                dateCreated: '2016-09-15',
                alertCodeDescription: 'Escape List',
              },
            ],
            escapeRiskAlerts: [
              {
                active: true,
                comment: 'First xer comment',
                expired: false,
                alertCode: 'XER',
                dateCreated: '2016-09-16',
                alertCodeDescription: 'Escape Risk',
              },
            ],
            provisionalCategorisation: 'C',
          },
          violenceProfile: {
            nomsId: 'B2345YZ',
            riskType: 'VIOLENCE',
            displayAssaults: false,
            numberOfAssaults: 5,
            notifySafetyCustodyLead: true,
            numberOfSeriousAssaults: 2,
            provisionalCategorisation: 'C',
            numberOfNonSeriousAssaults: 3,
            veryHighRiskViolentOffender: true,
          },
          extremismProfile: {
            nomsId: 'B2345YZ',
            riskType: 'EXTREMISM',
            notifyRegionalCTLead: false,
            increasedRiskOfExtremism: true,
            provisionalCategorisation: 'C',
          },
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        start_date: '2024-12-17T13:42:25.339Z',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: 1,
        assessment_date: null,
        approved_by: null,
        assessed_by: null,
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }
      delete expected.start_date

      const assessmentStartedToday = isToday(dbRecord.start_date)
      cy.log('assessmentStartedToday matches', assessmentStartedToday)

      const dbRecordMatchesExpected = compareObjects(expected, dbRecord)
      cy.log('dbRecordMatchesExpected', dbRecordMatchesExpected)

      return dbRecordMatchesExpected && assessmentStartedToday
    })
  })

  // it("should validate the Victim Contact Scheme page", () => {
  // });

  // it("should validate the Further Charges page", () => {
  // });
})
