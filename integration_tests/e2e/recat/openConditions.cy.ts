import moment from 'moment/moment'
import { RECATEGORISER_USER, SUPERVISOR_USER } from '../../factory/user'
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
import CategoriserSubmittedPage from '../../pages/taskList/categoriserSubmitted'
import RecatAwaitingApprovalPage from '../../pages/recatAwaitingSupervisorApproval/awaitingApprovalView'
import SupervisorHomePage from '../../pages/supervisor/home'
import SupervisorReviewPage from '../../pages/form/supervisor/review'
import SupervisorReviewOutcomePage from '../../pages/form/supervisor/outcome'
import SupervisorMessagePage from '../../pages/form/supervisor/message'
import SupervisorDonePage from '../../pages/supervisor/done'
import RecatApprovedViewPage from '../../pages/form/recatApprovedView'
import GiveBackToCategoriserPage from '../../pages/form/supervisor/giveBackToCategoriser'
import FurtherInformationPage from '../../pages/form/supervisor/furtherInformation'
import SupervisorConfirmBackPage from '../../pages/form/supervisor/confirmBack'
import GiveBackToCategoriserOutcome from '../../pages/form/supervisor/giveBackToCategoriserOutcome'

type DbQueryResult = { rowCount: number; rows: any[] }

describe('Open Conditions', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
  let today: Date

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    sentenceStartDates = {
      B2345XY: new Date('2019-01-28'),
      B2345YZ: new Date('2019-01-31'),
    }

    today = new Date()

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      // nomisSequenceNumber: 1,
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

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
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
      band: 4,
    })
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'XEL',
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
  })

  it('The happy path is correct for recategoriser setting cat D, all yeses, then cancelling open conditions', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    // Decision page
    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.catDOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(12).click()

    // 'the tasklist recat page is displayed with open conditions section added'
    tasklistRecatPage.openConditionsLink().should('exist')

    // 'open conditions task is selected'
    tasklistRecatPage.openConditionsLink().click()
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
    victimContactSchemaPage.setVictimLiaisonOfficerResponseTextInput('vlo response text')
    victimContactSchemaPage.continueButton().click()

    // 'the Foreign National page is displayed'
    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
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
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'D', justification: 'category justification text' },
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
            earliestReleaseDate: { justify: 'Yes', justifyText: 'justify details text', fiveOrMoreYears: 'Yes' },
            victimContactScheme: { vcsOptedFor: 'Yes', vloResponseText: 'vlo response text' },
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
          socProfile: {
            nomsId: 'B2345YZ',
            riskType: 'SOC',
            transferToSecurity: false,
            provisionalCategorisation: 'C',
          },
          extremismProfile: {
            notifyRegionalCTLead: false,
            increasedRiskOfExtremism: false,
          },
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        start_date: '2024-12-17T11:33:02.878Z',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: null,
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

      const dbRecordMatchesExpected = compareObjects(expected, dbRecord)

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
    tasklistRecatPage.openConditionsLink().should('not.exist')

    // 'a new cat entered and the tasklistRecat continue button is clicked'
    tasklistRecatPage.categoryDecisionLink().click()

    decisionPage.catCOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    tasklistRecatPage.checkAndSubmitCategorisationLink(12).click()

    // 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    const reviewRecatPage = Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 12)
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
      { question: 'Information about why this category is appropriate', expectedAnswer: 'category justification text' },
    ])
    reviewRecatPage.validateNextReviewDateSummary([
      { question: 'What date should they be reviewed by?', expectedAnswer: 'Saturday 14 December 2019' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'C', justification: 'category justification text' },
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
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
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
          extremismProfile: {},
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        start_date: '2024-12-17T13:42:25.339Z',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: null,
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

      const dbRecordMatchesExpected = compareObjects(expected, dbRecord)

      return dbRecordMatchesExpected && assessmentStartedToday
    })
  })

  it('The happy path is correct for recategoriser setting cat D, all nos', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.indeterminateWarning().should('not.exist')
    decisionPage.catDOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(12).click()

    // 'the tasklist recat page is displayed with open conditions section added'
    tasklistRecatPage.openConditionsLink().should('exist')

    // 'open conditions forms are completed'
    tasklistRecatPage.openConditionsLink().click()

    const tprsPage = Page.verifyOnPage(TprsPage)
    tprsPage.selectTprsRadioButton('NO')
    tprsPage.continueButton().click()

    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.selectEarliestReleaseDateRadioButton('NO')
    earliestReleasePage.continueButton().click()

    const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemaPage.selectVictimContactSchemeRadioButton('NO')
    victimContactSchemaPage.continueButton().click()

    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
    foreignNationalPage.selectForeignNationalRadioButton('NO')
    foreignNationalPage.continueButton().click()

    const riskOfHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfHarmPage.selectRiskOfSeriousHarmRadioButton('NO')
    riskOfHarmPage.continueButton().click()

    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.selectFurtherChargesRadioButton('NO')
    furtherChargesPage.continueButton().click()

    const riskOfEscapingOrAbscondingPage = Page.verifyOnPage(RiskLevelsPage)
    riskOfEscapingOrAbscondingPage.selectRiskLevelsRadioButton('NO')
    riskOfEscapingOrAbscondingPage.continueButton().click()

    // 'tasklist page is displayed with the open conditions section completed'
    tasklistRecatPage.openConditionsLink().should('exist')
    tasklistRecatPage.checkAndSubmitCategorisationLink(12).click()

    // 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    const reviewRecatPage = Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 26)
    reviewRecatPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateVictimContactSchemeSummary([
      {
        question: 'Does this prisoner have any victims opted in to the Victim Contact Scheme (VCS)?',
        expectedAnswer: 'No',
      },
    ])
    reviewRecatPage.validateForeignNationalSummary([
      { question: 'Are they a foreign national?', expectedAnswer: 'No' },
      { question: 'Have the Home Office confirmed their immigration status?', expectedAnswer: 'Not applicable' },
      { question: 'Do they have a liability for deportation?', expectedAnswer: 'Not applicable' },
      { question: 'Have they been through all appeals process in the UK?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateRiskOfHarmSummary([
      { question: 'Risk of serious harm to the public?', expectedAnswer: 'No' },
      { question: 'Can this risk be managed?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateRiskLevelSummary([
      { question: 'Likely to abscond or abuse open conditions?', expectedAnswer: 'No' },
    ])
    reviewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category D' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'category justification text' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'D', justification: 'category justification text' },
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
            tprs: { tprsSelected: 'No' },
            riskLevels: { likelyToAbscond: 'No' },
            riskOfHarm: { seriousHarm: 'No' },
            furtherCharges: { furtherCharges: 'No' },
            foreignNational: { isForeignNational: 'No' },
            earliestReleaseDate: { fiveOrMoreYears: 'No' },
            victimContactScheme: { vcsOptedFor: 'No' },
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
          socProfile: {
            nomsId: 'B2345YZ',
            riskType: 'SOC',
            transferToSecurity: false,
            provisionalCategorisation: 'C',
          },
          escapeProfile: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
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
          extremismProfile: {},
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: null,
        assessment_date: null,
        approved_by: null,
        assessed_by: null,
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }

      return compareObjects(expected, dbRecord)
    })

    // 'I confirm the cat D category'
    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })
    reviewRecatPage.saveAndSubmitButton().click()

    // 'the category is submitted'
    Page.verifyOnPage(CategoriserSubmittedPage)
    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'C',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-dd'),
          assessStatus: 'P',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'D',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-dd'),
          assessStatus: 'A',
        },
      ],
    })

    //  'The record is viewed by the recategoriser'
    cy.visit(RecategoriserHomePage.baseUrl)
    Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.viewReviewAwaitingApprovalForPrisoner(12)

    // 'The correct category is retrieved and data is correct'
    const recatAwaitingApprovalPage = Page.verifyOnPage(RecatAwaitingApprovalPage)
    recatAwaitingApprovalPage.getCategoryForApproval().contains('Category for approval is open category')
    recatAwaitingApprovalPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assessed_by).equals('RECATEGORISER_USER')
      expect(dbRecord.approved_by).equals(null)
      expect(dbRecord.assessment_date).not.equals(null)
      expect(dbRecord.nomis_sequence_no).equals(5)
      expect(dbRecord.status).equals('AWAITING_APPROVAL')

      return true
    })

    // 'the supervisor reviews and accepts the cat D'
    recatAwaitingApprovalPage.signOut().click()

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [sentenceStartDates.B2345XY],
    })
    cy.task('stubAssessments', {
      offenderNumber: 'dummy',
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(12)

    cy.task('stubSupervisorApprove')

    const supervisorReviewPage = Page.verifyOnPage(SupervisorReviewPage)
    cy.contains('The categoriser recommends open category')
    supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
    supervisorReviewPage.submitButton().click()

    const furtherInformationPage = FurtherInformationPage.createForBookingId(12)
    furtherInformationPage.enterFurtherInformation('super other info 1')
    furtherInformationPage.submitButton().click()

    // 'Data is stored correctly'

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assessed_by).equals('RECATEGORISER_USER')
      expect(dbRecord.approved_by).equals('SUPERVISOR_USER')
      expect(dbRecord.assessment_date).not.equals(null)
      expect(dbRecord.nomis_sequence_no).equals(5)
      expect(dbRecord.status).equals('APPROVED')
      expect(dbRecord.form_response.recat.decision).to.deep.equal({
        category: 'D',
        justification: 'category justification text',
      })
      expect(dbRecord.form_response.supervisor).to.deep.equal({
        review: { supervisorDecision: 'agreeWithCategoryDecision' },
        furtherInformation: { otherInformationText: 'super other info 1' },
      })

      return true
    })

    // 'the approved view page is shown'
    const supervisorReviewOutcomePage = Page.verifyOnPage(SupervisorReviewOutcomePage)
    supervisorReviewOutcomePage.smartSurveyLink().should('be.visible')
    supervisorReviewOutcomePage.finishButton().click()

    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

    Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.doneTabLink().click()

    cy.task('stubAgencyDetails', { agency: 'LEI' })

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 1 }).click()

    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Open category',
      'The categoriser recommends open category',
      'The supervisor also recommends open category',
    ])
    approvedViewRecatPage.validateCommentsVisibility({ areVisible: true })
  })

  it('recategoriser sets D, supervisor overrides to C', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.indeterminateWarning().should('not.exist')
    decisionPage.catDOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(12).click()

    // 'the tasklist recat page is displayed with open conditions section added'
    tasklistRecatPage.openConditionsLink().should('exist')

    // 'open conditions forms are completed'
    tasklistRecatPage.openConditionsLink().click()

    const tprsPage = Page.verifyOnPage(TprsPage)
    tprsPage.selectTprsRadioButton('NO')
    tprsPage.continueButton().click()

    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.selectEarliestReleaseDateRadioButton('NO')
    earliestReleasePage.continueButton().click()

    const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemaPage.selectVictimContactSchemeRadioButton('NO')
    victimContactSchemaPage.continueButton().click()

    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
    foreignNationalPage.selectForeignNationalRadioButton('NO')
    foreignNationalPage.continueButton().click()

    const riskOfHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfHarmPage.selectRiskOfSeriousHarmRadioButton('NO')
    riskOfHarmPage.continueButton().click()

    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.selectFurtherChargesRadioButton('NO')
    furtherChargesPage.continueButton().click()

    const riskOfEscapingOrAbscondingPage = Page.verifyOnPage(RiskLevelsPage)
    riskOfEscapingOrAbscondingPage.selectRiskLevelsRadioButton('NO')
    riskOfEscapingOrAbscondingPage.continueButton().click()

    // 'tasklist page is displayed with the open conditions section completed'
    tasklistRecatPage.openConditionsLink().should('exist')
    tasklistRecatPage.checkAndSubmitCategorisationLink(12).click()

    // 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    const reviewRecatPage = Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 26)
    reviewRecatPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateVictimContactSchemeSummary([
      {
        question: 'Does this prisoner have any victims opted in to the Victim Contact Scheme (VCS)?',
        expectedAnswer: 'No',
      },
    ])
    reviewRecatPage.validateForeignNationalSummary([
      { question: 'Are they a foreign national?', expectedAnswer: 'No' },
      { question: 'Have the Home Office confirmed their immigration status?', expectedAnswer: 'Not applicable' },
      { question: 'Do they have a liability for deportation?', expectedAnswer: 'Not applicable' },
      { question: 'Have they been through all appeals process in the UK?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateRiskOfHarmSummary([
      { question: 'Risk of serious harm to the public?', expectedAnswer: 'No' },
      { question: 'Can this risk be managed?', expectedAnswer: 'Not applicable' },
    ])
    reviewRecatPage.validateRiskLevelSummary([
      { question: 'Likely to abscond or abuse open conditions?', expectedAnswer: 'No' },
    ])
    reviewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category D' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'category justification text' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]
      delete dbRecord.start_date

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'D', justification: 'category justification text' },
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
            tprs: { tprsSelected: 'No' },
            riskLevels: { likelyToAbscond: 'No' },
            riskOfHarm: { seriousHarm: 'No' },
            furtherCharges: { furtherCharges: 'No' },
            foreignNational: { isForeignNational: 'No' },
            earliestReleaseDate: { fiveOrMoreYears: 'No' },
            victimContactScheme: { vcsOptedFor: 'No' },
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
          socProfile: {
            nomsId: 'B2345YZ',
            riskType: 'SOC',
            transferToSecurity: false,
            provisionalCategorisation: 'C',
          },
          escapeProfile: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
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
          extremismProfile: {},
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: null,
        assessment_date: null,
        approved_by: null,
        assessed_by: null,
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }

      return compareObjects(expected, dbRecord)
    })

    // 'I confirm the cat D category'
    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })
    reviewRecatPage.saveAndSubmitButton().click()

    // 'the category is submitted'
    Page.verifyOnPage(CategoriserSubmittedPage)
    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'C',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-dd'),
          assessStatus: 'P',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'D',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-dd'),
          assessStatus: 'A',
        },
      ],
    })

    //  'The record is viewed by the recategoriser'
    cy.visit(RecategoriserHomePage.baseUrl)
    Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.viewReviewAwaitingApprovalForPrisoner(12)

    // 'The correct category is retrieved and data is correct'
    const recatAwaitingApprovalPage = Page.verifyOnPage(RecatAwaitingApprovalPage)
    recatAwaitingApprovalPage.getCategoryForApproval().contains('Category for approval is open category')
    recatAwaitingApprovalPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assessed_by).equals('RECATEGORISER_USER')
      expect(dbRecord.approved_by).equals(null)
      expect(dbRecord.assessment_date).not.equals(null)
      expect(dbRecord.nomis_sequence_no).equals(5)
      expect(dbRecord.status).equals('AWAITING_APPROVAL')

      return true
    })

    // 'the supervisor reviews and overrides to cat C'
    recatAwaitingApprovalPage.signOut().click()

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [sentenceStartDates.B2345XY],
    })
    cy.task('stubAssessments', {
      offenderNumber: 'dummy',
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(12)

    cy.task('stubSupervisorApprove')

    const supervisorReviewPage = Page.verifyOnPage(SupervisorReviewPage)
    cy.contains('The categoriser recommends open category')
    supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_C').click()
    supervisorReviewPage.submitButton().click()

    const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(12, 'Change to Category C')
    giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('NO')
    cy.get('#supervisorOverriddenCategoryText').type('some justification of category change')
    giveBackToCategoriserPage.submitButton().click()

    const furtherInformationPage = FurtherInformationPage.createForBookingId(12)
    furtherInformationPage.enterFurtherInformation('super other info')
    furtherInformationPage.submitButton().click()

    // 'Data is stored correctly'

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]

      expect(dbRecord.assessed_by).equals('RECATEGORISER_USER')
      expect(dbRecord.approved_by).equals('SUPERVISOR_USER')
      expect(dbRecord.assessment_date).not.equals(null)
      expect(dbRecord.nomis_sequence_no).equals(5)
      expect(dbRecord.status).equals('APPROVED')
      expect(dbRecord.form_response.recat.decision).to.deep.equal({
        category: 'D',
        justification: 'category justification text',
      })
      expect(dbRecord.form_response.supervisor).to.deep.equal({
        review: {
          supervisorDecision: 'changeCategoryTo_C',
          supervisorOverriddenCategory: 'C',
          supervisorCategoryAppropriate: 'No',
        },
        changeCategory: {
          giveBackToCategoriser: 'No',
          supervisorOverriddenCategoryText: 'some justification of category change',
        },
        furtherInformation: {
          otherInformationText: 'super other info',
        },
      })

      return true
    })

    // 'the approved view page is shown'
    const supervisorReviewOutcomePage = Page.verifyOnPage(SupervisorReviewOutcomePage)
    supervisorReviewOutcomePage.smartSurveyLink().should('be.visible')
    supervisorReviewOutcomePage.finishButton().click()

    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

    Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.doneTabLink().click()

    cy.task('stubAgencyDetails', { agency: 'LEI' })

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 1 }).click()

    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Category C',
      'The categoriser recommends open category',
      'The recommended category was changed from open category to Category C',
    ])
    approvedViewRecatPage.validateCommentsVisibility({ areVisible: true })
    approvedViewRecatPage.validateOtherSupervisorComments({
      expectedComments: 'super other info',
    })
  })

  it('The happy path is correct for supervisor overriding to D', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.indeterminateWarning().should('not.exist')
    decisionPage.catCOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    tasklistRecatPage.checkAndSubmitCategorisationLink(12).click()

    // 'the review page is displayed and Data is stored correctly. Data is persisted (and displayed) - regardless of the decision to end the open conditions flow'
    const reviewRecatPage = Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 12)
    reviewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category C' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'category justification text' },
    ])

    // 'I confirm the cat C category'
    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'C',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })
    reviewRecatPage.saveAndSubmitButton().click()

    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]
      delete dbRecord.start_date
      delete dbRecord.assessment_date

      cy.log('dbRecord', JSON.stringify(dbRecord))

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'C', justification: 'category justification text' },
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
          openConditionsRequested: false,
        },
        booking_id: 12,
        user_id: null,
        status: 'AWAITING_APPROVAL',
        assigned_user_id: null,
        referred_date: null,
        referred_by: null,
        sequence_no: 1,
        risk_profile: {
          socProfile: { nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'C' },
          escapeProfile: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
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
          extremismProfile: {},
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        security_reviewed_by: null,
        security_reviewed_date: null,
        approval_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: 5,
        approved_by: null,
        assessed_by: 'RECATEGORISER_USER',
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }

      return compareObjects(expected, dbRecord)
    })

    // 'the category is submitted'
    const categoriserSubmittedPage = Page.verifyOnPage(CategoriserSubmittedPage)
    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'C',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-dd'),
          assessStatus: 'P',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'C',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-dd'),
          assessStatus: 'A',
        },
      ],
    })

    // 'the supervisor reviews and overrides to cat D'
    categoriserSubmittedPage.signOut().click()

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [sentenceStartDates.B2345XY],
    })
    cy.task('stubAssessments', {
      offenderNumber: 'dummy',
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(12)

    cy.task('stubSupervisorReject')

    const supervisorReviewPage = Page.verifyOnPage(SupervisorReviewPage)
    supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_D').click()
    supervisorReviewPage.submitButton().click()

    const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(12)
    supervisorConfirmBackPage.setConfirmationMessageText('super overriding C to D reason text')
    supervisorConfirmBackPage.saveAndReturnButton().click()

    const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
      12,
      CATEGORISATION_TYPE.RECAT,
    )
    giveBackToCategoriserOutcomePage.finishButton().should('be.visible').click()

    // 'supervisor is returned to home'
    Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.signOut().click()

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()

    Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

    // 'the categoriser looks at the supervisor message'
    tasklistRecatPage.supervisorMessageLink().click()

    // 'the supervisor message is available'
    const supervisorMessagePage = Page.verifyOnPage(SupervisorMessagePage)
    supervisorMessagePage.validateMessages([
      { question: 'Supervisor', expectedAnswer: 'Test User' },
      { question: 'Proposed change', expectedAnswer: 'Change the category to D' },
      { question: 'Message', expectedAnswer: 'super overriding C to D reason text' },
    ])
    supervisorMessagePage.saveAndReturnButton().click()

    // 'the recategoriser chooses cat D instead of C'
    Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    Page.verifyOnPage(DecisionPage)
    decisionPage.indeterminateWarning().should('not.exist')
    decisionPage.catDOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(12).click()

    // 'open conditions forms are accessed by categoriser'
    tasklistRecatPage.openConditionsLink().should('exist')
    tasklistRecatPage.openConditionsLink().click()

    const tprsPage = Page.verifyOnPage(TprsPage)
    tprsPage.selectTprsRadioButton('NO')
    tprsPage.continueButton().click()

    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.selectEarliestReleaseDateRadioButton('NO')
    earliestReleasePage.continueButton().click()

    const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemaPage.selectVictimContactSchemeRadioButton('NO')
    victimContactSchemaPage.continueButton().click()

    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
    foreignNationalPage.selectForeignNationalRadioButton('NO')
    foreignNationalPage.continueButton().click()

    const riskOfHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfHarmPage.selectRiskOfSeriousHarmRadioButton('NO')
    riskOfHarmPage.continueButton().click()

    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.selectFurtherChargesRadioButton('NO')
    furtherChargesPage.continueButton().click()

    const riskOfEscapingOrAbscondingPage = Page.verifyOnPage(RiskLevelsPage)
    riskOfEscapingOrAbscondingPage.selectRiskLevelsRadioButton('NO')
    riskOfEscapingOrAbscondingPage.continueButton().click()

    tasklistRecatPage.checkAndSubmitCategorisationLink(12).click()

    // 'the review page is displayed'
    Page.verifyOnPage(ReviewRecatPage)
    reviewRecatPage.changeLinks().should('have.length', 26)
    reviewRecatPage.validateCategoryDecisionSummary([
      { question: 'What security category is most suitable for this person?', expectedAnswer: 'Category D' },
      { question: 'Information about why this category is appropriate', expectedAnswer: 'category justification text' },
    ])

    // 'I confirm the cat D category'
    cy.task('stubCategoriseUpdate', {
      bookingId: 12,
      category: 'D',
      nextReviewDate: '2019-12-14',
      sequenceNumber: 5,
    })
    reviewRecatPage.saveAndSubmitButton().click()

    // 'the category is submitted'
    Page.verifyOnPage(CategoriserSubmittedPage)

    // 'The record is viewed by the recategoriser'
    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'C',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-dd'),
          assessStatus: 'P',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'C',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-dd'),
          assessStatus: 'A',
        },
      ],
    })
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
    })

    categoriserSubmittedPage.signOut().click()

    // 'the supervisor reviews and accepts the cat D'
    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [sentenceStartDates.B2345XY],
    })
    cy.task('stubAssessments', {
      offenderNumber: 'dummy',
    })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(12)

    cy.task('stubSupervisorApprove')

    Page.verifyOnPage(SupervisorReviewPage)
    cy.contains('The categoriser recommends open category')
    supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
    supervisorReviewPage.submitButton().click()

    const furtherInformationPage = FurtherInformationPage.createForBookingId(12)
    furtherInformationPage.enterFurtherInformation('super other info 1 + 2')
    furtherInformationPage.submitButton().click()

    const supervisorReviewOutcomePage = Page.verifyOnPage(SupervisorReviewOutcomePage)
    supervisorReviewOutcomePage.smartSurveyLink().should('be.visible')
    supervisorReviewOutcomePage.finishButton().click()

    // 'Data is stored correctly'
    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, (data: DbQueryResult) => {
      const dbRecord = data.rows[0]
      delete dbRecord.start_date
      delete dbRecord.approval_date
      delete dbRecord.assessment_date

      cy.log(JSON.stringify(dbRecord))

      const expected = {
        id: -1,
        form_response: {
          recat: {
            decision: { category: 'D', justification: 'category justification text' },
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
          supervisor: {
            review: {
              supervisorDecision: 'agreeWithCategoryDecision',
            },
            confirmBack: {
              isRead: true,
              messageText: 'super overriding C to D reason text',
              supervisorName: 'Test User',
            },
            furtherInformation: { otherInformationText: 'super other info 1 + 2' },
          },
          openConditions: {
            tprs: { tprsSelected: 'No' },
            riskLevels: { likelyToAbscond: 'No' },
            riskOfHarm: { seriousHarm: 'No' },
            furtherCharges: { furtherCharges: 'No' },
            foreignNational: { isForeignNational: 'No' },
            earliestReleaseDate: { fiveOrMoreYears: 'No' },
            victimContactScheme: { vcsOptedFor: 'No' },
          },
          openConditionsRequested: true,
        },
        booking_id: 12,
        user_id: null,
        status: 'APPROVED',
        assigned_user_id: null,
        referred_date: null,
        referred_by: null,
        sequence_no: 1,
        risk_profile: {
          catHistory: [
            {
              bookingId: -45,
              offenderNo: 'B2345YZ',
              approvalDate: '2013-03-24',
              assessmentCode: 'CATEGORY',
              assessmentDate: '2013-03-24',
              classification: 'Cat B',
              nextReviewDate: '2013-09-17',
              assessmentStatus: 'I',
              agencyDescription: 'LPI prison',
              assessmentAgencyId: 'LPI',
              classificationCode: 'B',
              approvalDateDisplay: '24/03/2013',
              cellSharingAlertFlag: false,
              assessmentDescription: 'Categorisation',
            },
            {
              bookingId: -45,
              offenderNo: 'B2345YZ',
              approvalDate: '2012-06-08',
              assessmentCode: 'CATEGORY',
              assessmentDate: '2012-04-04',
              classification: 'Cat A',
              nextReviewDate: '2012-06-07',
              assessmentStatus: 'A',
              agencyDescription: 'LPI prison',
              assessmentAgencyId: 'LPI',
              classificationCode: 'A',
              approvalDateDisplay: '08/06/2012',
              cellSharingAlertFlag: false,
              assessmentDescription: 'Categorisation',
            },
          ],
          socProfile: { nomsId: 'B2345YZ', riskType: 'SOC', transferToSecurity: false, provisionalCategorisation: 'C' },
          escapeProfile: {
            riskType: 'ESCAPE',
            activeEscapeList: true,
            activeEscapeRisk: false,
            escapeListAlerts: [{ alertCode: 'XEL', dateCreated: '2016-09-14' }],
            escapeRiskAlerts: [],
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
          extremismProfile: {},
        },
        prison_id: 'LEI',
        offender_no: 'B2345YZ',
        security_reviewed_by: null,
        security_reviewed_date: null,
        cat_type: 'RECAT',
        nomis_sequence_no: 5,
        approved_by: 'SUPERVISOR_USER',
        assessed_by: 'RECATEGORISER_USER',
        review_reason: 'DUE',
        due_by_date: null,
        cancelled_date: null,
        cancelled_by: null,
      }

      return compareObjects(expected, dbRecord)
    })

    // 'the approved view page is shown'

    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })

    supervisorHomePage.doneTabLink().click()

    cy.task('stubAgencyDetails', { agency: 'LEI' })

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 1 }).click()

    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Open category',
      'The categoriser recommends open category',
      'The supervisor also recommends open category',
    ])
    approvedViewRecatPage.validateCommentsVisibility({ areVisible: true })
    approvedViewRecatPage.validateOtherSupervisorComments({
      expectedComments: 'super other info 1 + 2',
    })
  })

  describe('conditional release or parole eligibility date', () => {
    it('shows Parole eligibility date', () => {
      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

      const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
      tasklistRecatPage.categoryDecisionLink().click()

      const decisionPage = Page.verifyOnPage(DecisionPage)
      decisionPage.assertTextVisibilityOnPage({ selector: 'span', text: 'Parole eligibility date: ' })
      decisionPage.assertTextVisibilityOnPage({ selector: 'span', text: 'Saturday 13 June 2020' })
    })

    it('shows Conditional release date', () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345YZ',
        youngOffender: false,
        indeterminateSentence: false,
        paroleEligibilityDate: null,
      })

      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

      const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
      tasklistRecatPage.categoryDecisionLink().click()

      const decisionPage = Page.verifyOnPage(DecisionPage)
      decisionPage.checkConditionalReleaseDateInsetText('2020-02-02')
    })

    it('does not render Conditional release date is not available', () => {
      cy.task('stubGetOffenderDetails', {
        bookingId: 12,
        offenderNo: 'B2345YZ',
        youngOffender: false,
        indeterminateSentence: false,
        paroleEligibilityDate: null,
        conditionalReleaseDate: null,
      })

      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

      const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
      tasklistRecatPage.categoryDecisionLink().click()

      const decisionPage = Page.verifyOnPage(DecisionPage)
      decisionPage.assertTextVisibilityOnPage({ selector: 'span', text: 'Parole eligibility date: ', isVisible: false })
      decisionPage.assertTextVisibilityOnPage({
        selector: 'span',
        text: 'Conditional release date: ',
        isVisible: false,
      })
    })
  })

  describe('Not suitable for Open Conditions', () => {
    beforeEach(() => {
      const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
      recategoriserHomePage.continueReviewForPrisoner(12, 'DUE')

      const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
      tasklistRecatPage.categoryDecisionLink().click()

      // Decision page
      const decisionPage = Page.verifyOnPage(DecisionPage)
      decisionPage.catDOption().click()
      decisionPage.enterCategoryDecisionJustification('category justification text')
      decisionPage.submitButton().click()

      // Open Conditions Added Page
      const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
      openConditionsAddedPage.returnToRecatTasklistButton(12).click()

      // 'the tasklist recat page is displayed with open conditions section added'
      tasklistRecatPage.openConditionsLink().should('exist')

      // 'open conditions task is selected'
      tasklistRecatPage.openConditionsLink().click()
      const tprsPage = Page.verifyOnPage(TprsPage)

      // 'the TPRS page is displayed'
      tprsPage.selectTprsRadioButton('YES')
      tprsPage.continueButton().click()
    })

    it('Shows correct message when not suitable for open conditions because of earliest release date 3 to 5 change', () => {
      // 'the Earliest Release page is displayed'
      const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
      earliestReleasePage.selectEarliestReleaseDateRadioButton('YES')
      earliestReleasePage.selectJustifyRadioButton('NO')
      earliestReleasePage.continueButton().click()

      cy.get('h1').should('contain.text', 'Not suitable for open conditions')
      cy.contains(
        'This person cannot be sent to open conditions because they have more than 5 years to their earliest release date and there are no special circumstances to warrant them moving into open conditions',
      )
    })

    it('Shows correct message when not suitable for open conditions because of foreign national form', () => {
      // 'the Earliest Release page is displayed'
      const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
      earliestReleasePage.selectEarliestReleaseDateRadioButton('YES')
      earliestReleasePage.selectJustifyRadioButton('YES')
      earliestReleasePage.setJustifyOpenConditionsTextInput('justify details text')
      earliestReleasePage.continueButton().click()

      const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
      victimContactSchemaPage.selectVictimContactSchemeRadioButton('YES')
      victimContactSchemaPage.setVictimLiaisonOfficerResponseTextInput('vlo response text')
      victimContactSchemaPage.continueButton().click()

      const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
      foreignNationalPage.validateInsetText()
      foreignNationalPage.selectForeignNationalRadioButton('YES')
      foreignNationalPage.selectHomeOfficeImmigrationStatusRadioButton('NO')
      foreignNationalPage.continueButton().click()

      cy.get('h1').should('contain.text', 'Not suitable for open conditions')
      cy.contains('This person cannot be sent to open conditions without a CCD3 form')
    })

    it('Shows correct message when not suitable for open conditions because of foreign national exhausted appeals', () => {
      // 'the Earliest Release page is displayed'
      const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
      earliestReleasePage.selectEarliestReleaseDateRadioButton('YES')
      earliestReleasePage.selectJustifyRadioButton('YES')
      earliestReleasePage.setJustifyOpenConditionsTextInput('justify details text')
      earliestReleasePage.continueButton().click()

      const victimContactSchemaPage = Page.verifyOnPage(VictimContactSchemePage)
      victimContactSchemaPage.selectVictimContactSchemeRadioButton('YES')
      victimContactSchemaPage.setVictimLiaisonOfficerResponseTextInput('vlo response text')
      victimContactSchemaPage.continueButton().click()

      const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
      foreignNationalPage.validateInsetText()
      foreignNationalPage.selectForeignNationalRadioButton('YES')
      foreignNationalPage.selectHomeOfficeImmigrationStatusRadioButton('YES')
      foreignNationalPage.selectLiabilityToBeDeportedRadioButton('YES')
      foreignNationalPage.selectExhaustedAppealRadioButton('YES')
      foreignNationalPage.continueButton().click()

      cy.get('h1').should('contain.text', 'Not suitable for open conditions')
      cy.contains(
        'This person cannot be sent to open conditions because they have a liability for deportation and have exhausted all appeal rights in the UK',
      )
    })
  })
})
