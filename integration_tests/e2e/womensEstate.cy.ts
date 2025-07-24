import moment from 'moment/moment'
import { CASELOAD } from '../factory/caseload'
import { FEMALE_USER, WOMEN_SUPERVISOR_USER } from '../factory/user'
import Page from '../pages/page'
import CategoriserHomePage from '../pages/categoriser/home'
import TaskListPage from '../pages/taskList/taskList'
import CategoriserOffendingHistoryPage from '../pages/form/ratings/offendingHistory'
import ViolencePage from '../pages/form/ratings/violence'
import EscapePage from '../pages/form/ratings/escape'
import ExtremismPage from '../pages/form/ratings/extremism'
import CategoriserSecurityInputPage from '../pages/form/ratings/categoriserSecurityInputPage'
import CategoryDecisionPage from '../pages/form/ratings/categoryDecision'
import NextReviewQuestionPage from '../pages/form/ratings/nextReviewQuestionPage'
import NextReviewConfirmationPage from '../pages/form/ratings/nextReviewConfirmationPage'
import CategoriserReviewCYAPage from '../pages/form/categoriser/review'
import CategoriserSubmittedPage from '../pages/taskList/categoriserSubmitted'
import dbSeeder from '../fixtures/db-seeder'
import SupervisorHomePage from '../pages/supervisor/home'
import SupervisorReviewPage, { supervisorDecisionRadioButtonChoices } from "../pages/form/supervisor/review";
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import SupervisorReviewOutcomePage from '../pages/form/supervisor/outcome'
import indeterminateSentenceWarning from '../fixtures/womensEstate/indeterminateSentenceWarning'
import initialCategorisation from '../fixtures/womensEstate/initialCategorisation'
import femaleYoungOffenders from '../fixtures/womensEstate/femaleYoungOffenders'
import { FormDbJson } from '../fixtures/db-key-convertor'
import Status from '../../server/utils/statusEnum'
import OpenConditionsAdded from '../pages/openConditionsAdded'
import EarliestReleaseDatePage from '../pages/form/openConditions/earliestReleaseDate'
import PreviousSentencesPage from '../pages/form/openConditions/previousSentences'
import SexualOffencesPage from '../pages/form/openConditions/sexualOffences'
import VictimContactSchemePage from '../pages/form/openConditions/victimContactScheme'
import ForeignNationalPage from '../pages/form/openConditions/foreignNational'
import RiskOfSeriousHarmPage from '../pages/form/openConditions/riskOfSeriousHarm'
import FurtherChargesPage from '../pages/form/openConditions/furtherCharges'
import RiskLevelsPage from '../pages/form/openConditions/riskLevels'
import SupervisorConfirmBackPage from '../pages/form/supervisor/confirmBack'
import FurtherInformationPage from "../pages/form/supervisor/furtherInformation";
import GiveBackToCategoriserPage from "../pages/form/supervisor/giveBackToCategoriser";
import GiveBackToCategoriserOutcome from "../pages/form/supervisor/giveBackToCategoriserOutcome";

const SHORT_DATE_FORMAT = 'D/M/YYYY'
const LONG_DATE_FORMAT = 'dddd D MMMM YYYY'

const commonColumn2 = [
  {
    key: 'Location',
    value: `C-04-02`,
  },
  {
    key: 'Location',
    value: `Coventry`,
  },
  {
    key: 'Nationality',
    value: `Latvian`,
  },
  {
    key: 'Main offence',
    value: `A Felony`,
  },
  {
    key: 'Main offence',
    value: `Another Felony`,
  },
]

describe("Women's Estate", () => {
  let bookingId: number
  let category: string
  let offenderNo: string
  let sixMonthsFromNow: moment.Moment

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    bookingId = 700
    offenderNo = 'ON700'
    sixMonthsFromNow = moment().add(6, 'months')
  })

  describe('Initial Categorisation', () => {
    let taskListPage: TaskListPage

    beforeEach(() => {
      category = 'U(Unsentenced)'

      cy.task('stubUncategorisedNoStatus', { bookingId, location: CASELOAD.PFI.id })
      cy.task('stubSentenceData', {
        offenderNumbers: [offenderNo],
        bookingIds: [bookingId],
        startDates: [moment().subtract(3, 'days')],
      })

      cy.task('stubGetOffenderDetailsWomen', { bookingId, category })
      cy.task('stubGetSocProfile', {
        offenderNo,
        category,
        transferToSecurity: false,
      })
      cy.task('stubGetExtremismProfile', {
        offenderNo,
        category,
        increasedRisk: false,
        notifyRegionalCTLead: false,
      })
      cy.stubLogin({
        user: FEMALE_USER,
      })
      cy.signIn()
    })

    const commonInitialCategorisationSteps = () => {
      const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId)

      taskListPage = TaskListPage.createForBookingId(bookingId)

      taskListPage.smartSurveyLink().should('be.visible')

      cy.validateCategorisationDetails([
        // column 1
        [
          { key: 'Name', value: 'Hillmob, William' },
          { key: 'NOMIS ID', value: offenderNo },
          { key: 'Date of birth', value: '17/02/1970' },
          { key: 'Current category', value: category },
        ],
        // column 2
        commonColumn2,
        // column 3
        [
          { key: 'HDC Eligibility Date', value: '10/06/2020' },
          { key: 'Automatic Release Date', value: '11/06/2020' },
          { key: 'Conditional Release Date', value: '02/02/2020' },
          { key: 'Parole Eligibility Date', value: '13/06/2020' },
          { key: 'Non Parole Date', value: '14/06/2020' },
          { key: 'ISP Tariff End Date', value: '15/06/2020' },
          { key: 'Licence Expiry Date', value: '16/06/2020' },
          { key: 'Sentence Expiry Date', value: '17/06/2020' },
          { key: 'Court-issued sentence', value: '6 years, 3 months (Std sentence)' },
        ],
      ])

      cy.task('stubAssessmentsWomen', { offenderNo })
      cy.task('stubSentenceDataGetSingle', { offenderNumber: offenderNo, formattedReleaseDate: '2014-11-23' })
      cy.task('stubOffenceHistory', { offenderNumber: offenderNo })

      taskListPage.offendingHistoryButton().click()

      const categoriserOffendingHistoryPage = CategoriserOffendingHistoryPage.createForBookingId(12)
      categoriserOffendingHistoryPage.selectPreviousConvictionsRadioButton('NO')
      categoriserOffendingHistoryPage.saveAndReturnButton().click()

      cy.task('stubGetViolenceProfile', {
        offenderNo,
        category,
        veryHighRiskViolentOffender: false,
        notifySafetyCustodyLead: false,
        displayAssaults: false,
      })

      taskListPage.violenceButton().click()

      const violencePage = ViolencePage.createForBookingId(bookingId)
      violencePage.validateViolenceWarningExists({ exists: false })
      violencePage.selectHighRiskOfViolenceRadioButton('NO')
      violencePage.selectSeriousThreadRadioButton('NO')
      violencePage.saveAndReturnButton().click()

      cy.task('stubGetEscapeProfile', {
        offenderNo,
        category,
        onEscapeList: false,
        activeOnEscapeList: false,
      })

      taskListPage.escapeButton().click()

      const escapePage = EscapePage.createForBookingId(bookingId)
      escapePage.selectOtherEvidenceBRadioButton('NO')
      escapePage.saveAndReturnButton().click()

      taskListPage.extremismButton().click()

      const extremismPage = ExtremismPage.createForBookingId(bookingId)
      extremismPage.selectPreviousTerrorismOffencesRadioButton('YES')
      extremismPage.setPreviousTerrorismOffencesText('Some risk text')
      extremismPage.saveAndReturnButton().click()

      taskListPage.securityButton().click()

      const categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
      categoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
      categoriserOffendingHistoryPage.saveAndReturnButton().click()

      taskListPage.nextReviewDateButton().click()

      const nextReviewQuestionPage = NextReviewQuestionPage.createForBookingId(bookingId)
      nextReviewQuestionPage.selectNextReviewRadioButton('IN_SIX_MONTHS')
      nextReviewQuestionPage.continueButton().click()

      const nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(bookingId, '6')
      nextReviewConfirmationPage.saveAndReturnButton().click()

      cy.task('stubGetExtremismProfile', {
        offenderNo,
        category,
        increasedRisk: true,
        notifyRegionalCTLead: false,
        previousOffences: true,
      })
    }

    it('should allow an initial categorisation - Closed', () => {
      commonInitialCategorisationSteps()

      taskListPage.categoryDecisionButton().click()

      const categoryDecisionPage = CategoryDecisionPage.createForBookingId(bookingId)
      categoryDecisionPage.selectCategoryDecisionRadioButton('CLOSED')
      categoryDecisionPage.enterCategoryDecisionJustification('justification for category')
      categoryDecisionPage.continueButton().click()

      cy.task('stubGetLifeProfile', {
        offenderNo,
        category: 'R',
      })

      taskListPage.validateSummarySectionText(['Review and categorisation', 'All tasks completed'])
      taskListPage.continueReviewAndCategorisationButton(bookingId).click()

      cy.task('stubCategorise', {
        expectedCat: 'R',
        nextReviewDate: sixMonthsFromNow.format(LONG_DATE_FORMAT),
      })

      const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(bookingId)
      categoriserReviewCYAPage.changeLinks().should('have.length', 10)
      cy.validateCategorisationDetails([
        // column 1
        [
          { key: 'Name', value: 'Hillmob, William' },
          { key: 'NOMIS ID', value: offenderNo },
          { key: 'Date of birth', value: '17/02/1970' },
          { key: 'Current category', value: category },
        ],
        // column 2
        commonColumn2,
        // column 3
        [
          { key: 'HDC Eligibility Date', value: '10/06/2020' },
          { key: 'Automatic Release Date', value: '11/06/2020' },
          { key: 'Conditional Release Date', value: '02/02/2020' },
          { key: 'Parole Eligibility Date', value: '13/06/2020' },
          { key: 'Non Parole Date', value: '14/06/2020' },
          { key: 'ISP Tariff End Date', value: '15/06/2020' },
          { key: 'Licence Expiry Date', value: '16/06/2020' },
          { key: 'Sentence Expiry Date', value: '17/06/2020' },
          { key: 'Court-issued sentence', value: '6 years, 3 months (Std sentence)' },
        ],
      ])
      ;[
        // offending history
        { term: 'Previous Cat A, Restricted.', definition: 'No Cat A, Restricted' },
        { term: 'Previous convictions on NOMIS', definition: 'Libel (21/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Slander (22/02/2019 - 24/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Undated offence' },
        { term: 'Relevant convictions on PNC', definition: 'No' },
        // safety and good order
        { term: 'Previous assaults in custody recorded', definition: '5' },
        { term: 'Serious assaults in the past 12 months', definition: '2' },
        { term: 'Any more information about risk of violence in custody', definition: 'No' },
        { term: 'Serious threats to good order in custody recorded', definition: 'No' },
        // risk of escape
        { term: 'Escape list', definition: 'No' },
        { term: 'Escape alerts', definition: 'No' },
        { term: 'Any other information that they pose an escape risk', definition: 'No' },
        { term: 'Any further details', definition: 'No' },
        // extremism
        { term: 'Identified at risk of engaging in, or vulnerable to, extremism', definition: 'Yes' },
        { term: 'Offences under terrorism legislation', definition: 'Yes' },
        // security information
        { term: 'Automatic referral to security team', definition: 'No' },
        { term: 'Manual referral to security team', definition: 'No' },
        { term: 'Flagged by security team', definition: 'No' },
        // category decision
        { term: 'What security category is most suitable for this person?', definition: 'Closed' },
        { term: 'Information about why this category is appropriate', definition: 'justification for category' },
        // next category review date
        { term: 'What date should they be reviewed by?', definition: sixMonthsFromNow.format(LONG_DATE_FORMAT) },
      ].forEach(cy.checkDefinitionList)

      categoriserReviewCYAPage.continueButton().click()

      const categoriserSubmittedPage = CategoriserSubmittedPage.createForBookingId(bookingId)
      categoriserSubmittedPage.finishButton().click()

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.AWAITING_APPROVAL.name)
        expect(result.rows[0].form_response).to.deep.eq({
          ratings: {
            decision: { category: 'R', justification: 'justification for category' },
            escapeRating: { escapeCatB: 'No', escapeOtherEvidence: 'No' },
            securityInput: { securityInputNeeded: 'No' },
            nextReviewDate: { date: sixMonthsFromNow.format(SHORT_DATE_FORMAT), indeterminate: 'false' },
            violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
            extremismRating: { previousTerrorismOffences: 'Yes', previousTerrorismOffencesText: 'Some risk text' },
            offendingHistory: { previousConvictions: 'No' },
          },
          categoriser: { provisionalCategory: { suggestedCategory: 'R', categoryAppropriate: 'Yes' } },
          openConditionsRequested: false,
        })
        expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
        expect(result.rows[0].user_id).to.eq(FEMALE_USER.username)
        expect(result.rows[0].approved_by).to.eq(null)
      })
    })

    it('should allow an initial categorisation - Open', () => {
      commonInitialCategorisationSteps()

      taskListPage.categoryDecisionButton().click()

      const categoryDecisionPage = CategoryDecisionPage.createForBookingId(bookingId)
      categoryDecisionPage.selectCategoryDecisionRadioButton('OPEN')
      categoryDecisionPage.enterCategoryDecisionJustification('justification for open conditions')
      categoryDecisionPage.continueButton().click()

      const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
      openConditionsAddedPage.returnToTasklistButton(bookingId).click()

      taskListPage.openConditionsButton().click()

      const earliestReleaseDatePage = EarliestReleaseDatePage.createForBookingId(bookingId)
      earliestReleaseDatePage.selectEarliestReleaseDateRadioButton('NO')
      earliestReleaseDatePage.continueButton().click()

      const previousSentencesPage = PreviousSentencesPage.createForBookingId(bookingId)
      previousSentencesPage.selectPreviousSentencesRadioButton('NO')
      previousSentencesPage.continueButton().click()

      const victimContactSchemePage = VictimContactSchemePage.createForBookingId(bookingId)
      victimContactSchemePage.selectVictimContactSchemeRadioButton('NO')
      victimContactSchemePage.continueButton().click()

      const sexualOffencesPage = SexualOffencesPage.createForBookingId(bookingId)
      sexualOffencesPage.selectSexualOffencesRadioButton('NO')
      sexualOffencesPage.continueButton().click()

      const foreignNationalPage = ForeignNationalPage.createForBookingId(bookingId)
      foreignNationalPage.selectForeignNationalRadioButton('NO')
      foreignNationalPage.continueButton().click()

      const riskOfSeriousHarmPage = RiskOfSeriousHarmPage.createForBookingId(bookingId)
      riskOfSeriousHarmPage.selectRiskOfSeriousHarmRadioButton('NO')
      riskOfSeriousHarmPage.continueButton().click()

      const furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
      furtherChargesPage.selectFurtherChargesRadioButton('NO')
      furtherChargesPage.continueButton().click()

      const riskLevelsPage = RiskLevelsPage.createForBookingId(bookingId)
      riskLevelsPage.selectRiskLevelsRadioButton('NO')
      riskLevelsPage.continueButton().click()

      // cy.visit(`/form/openconditions/provisionalCategory/${bookingId}`)
      // cy.url().should('include', `tasklist/${bookingId}`)

      cy.task('stubGetLifeProfile', {
        offenderNo,
        category: 'R',
      })

      taskListPage.validateSummarySectionText(['Review and categorisation', 'All tasks completed'])
      taskListPage.continueReviewAndCategorisationButton(bookingId).click()

      cy.task('stubCategorise', {
        expectedCat: 'R',
        nextReviewDate: sixMonthsFromNow,
      })

      const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(bookingId)
      categoriserReviewCYAPage.changeLinks().should('have.length', 27)
      cy.validateCategorisationDetails([
        // column 1
        [
          { key: 'Name', value: 'Hillmob, William' },
          { key: 'NOMIS ID', value: offenderNo },
          { key: 'Date of birth', value: '17/02/1970' },
          { key: 'Current category', value: category },
        ],
        // column 2
        commonColumn2,
        // column 3
        [
          { key: 'HDC Eligibility Date', value: '10/06/2020' },
          { key: 'Automatic Release Date', value: '11/06/2020' },
          { key: 'Conditional Release Date', value: '02/02/2020' },
          { key: 'Parole Eligibility Date', value: '13/06/2020' },
          { key: 'Non Parole Date', value: '14/06/2020' },
          { key: 'ISP Tariff End Date', value: '15/06/2020' },
          { key: 'Licence Expiry Date', value: '16/06/2020' },
          { key: 'Sentence Expiry Date', value: '17/06/2020' },
          { key: 'Court-issued sentence', value: '6 years, 3 months (Std sentence)' },
        ],
      ])
      ;[
        // offending history
        { term: 'Previous Cat A, Restricted.', definition: 'No Cat A, Restricted' },
        { term: 'Previous convictions on NOMIS', definition: 'Libel (21/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Slander (22/02/2019 - 24/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Undated offence' },
        { term: 'Relevant convictions on PNC', definition: 'No' },
        // safety and good order
        { term: 'Previous assaults in custody recorded', definition: '5' },
        { term: 'Serious assaults in the past 12 months', definition: '2' },
        { term: 'Any more information about risk of violence in custody', definition: 'No' },
        { term: 'Serious threats to good order in custody recorded', definition: 'No' },
        // risk of escape
        { term: 'Escape list', definition: 'No' },
        { term: 'Escape alerts', definition: 'No' },
        { term: 'Any other information that they pose an escape risk', definition: 'No' },
        { term: 'Any further details', definition: 'No' },
        // extremism
        { term: 'Identified at risk of engaging in, or vulnerable to, extremism', definition: 'Yes' },
        { term: 'Offences under terrorism legislation', definition: 'Yes' },
        { term: 'Offences under terrorism legislation', definition: 'Some risk text' },
        // security information
        { term: 'Automatic referral to security team', definition: 'No' },
        { term: 'Manual referral to security team', definition: 'No' },
        { term: 'Flagged by security team', definition: 'No' },
        // category decision
        { term: 'What security category is most suitable for this person?', definition: 'Open' },
        { term: 'Information about why this category is appropriate', definition: 'justification for open conditions' },
        // next category review date
        {
          term: 'What date should they be reviewed by?',
          definition: sixMonthsFromNow.format(LONG_DATE_FORMAT),
        },
        // open conditions
        // earliest release date
        { term: '5 or more years until earliest release date?', definition: 'No' },
        { term: 'Reasons that justify moving to open conditions?', definition: 'Not applicable' },
        // previous sentences
        { term: 'Have they been released from a previous sentence in the last 5 years?', definition: 'No' },
        { term: 'Was that previous sentence for 7 years or more?', definition: 'Not applicable' },
        // victim contact scheme
        { term: 'Does this prisoner have any victims opted in to the Victim Contact Scheme (VCS)?', definition: 'No' },
        // sexual offences
        { term: 'Have they ever been convicted of a sexual offence?', definition: 'No' },
        { term: 'Can the risk to the public be managed in open conditions?', definition: 'Not applicable' },
        // foreign national
        { term: 'Are they a foreign national?', definition: 'No' },
        { term: 'Have the Home Office confirmed their immigration status?', definition: 'Not applicable' },
        { term: 'Do they have a liability for deportation?', definition: 'Not applicable' },
        { term: 'Have they been through all appeals process in the UK?', definition: 'Not applicable' },
        // risk of serious harm
        { term: 'Risk of serious harm to the public?', definition: 'No' },
        { term: 'Can this risk be managed?', definition: 'Not applicable' },
        // further charges
        { term: 'Are they facing any further charges?', definition: 'No' },
        { term: 'Further charges details', definition: 'Not applicable' },
        { term: 'Do these further charges increase risk in open conditions?', definition: 'Not applicable' },
        // risk of escaping or absconding
        { term: 'Likely to abscond or abuse open conditions?', definition: 'No' },
      ].forEach(cy.checkDefinitionList)

      categoriserReviewCYAPage.continueButton().click()

      const categoriserSubmittedPage = CategoriserSubmittedPage.createForBookingId(bookingId)
      categoriserSubmittedPage.finishButton().click()

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.AWAITING_APPROVAL.name)
        expect(result.rows[0].form_response).to.deep.eq({
          ratings: {
            decision: {
              category: 'T',
              justification: 'justification for open conditions',
            },
            escapeRating: {
              escapeCatB: 'No',
              escapeOtherEvidence: 'No',
            },
            securityInput: {
              securityInputNeeded: 'No',
            },
            nextReviewDate: {
              date: sixMonthsFromNow.format(SHORT_DATE_FORMAT),
              indeterminate: 'false',
            },
            violenceRating: {
              seriousThreat: 'No',
              highRiskOfViolence: 'No',
            },
            extremismRating: {
              previousTerrorismOffences: 'Yes',
              previousTerrorismOffencesText: 'Some risk text',
            },
            offendingHistory: {
              previousConvictions: 'No',
            },
          },
          categoriser: {
            provisionalCategory: {
              suggestedCategory: 'T',
              categoryAppropriate: 'Yes',
            },
          },
          openConditions: {
            riskLevels: {
              likelyToAbscond: 'No',
            },
            riskOfHarm: {
              seriousHarm: 'No',
            },
            furtherCharges: {
              furtherCharges: 'No',
            },
            sexualOffences: {
              haveTheyBeenEverConvicted: 'No',
            },
            foreignNational: {
              isForeignNational: 'No',
            },
            previousSentences: {
              releasedLastFiveYears: 'No',
            },
            earliestReleaseDate: {
              fiveOrMoreYears: 'No',
            },
            victimContactScheme: {
              vcsOptedFor: 'No',
            },
          },
          openConditionsRequested: true,
        })
        expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
        expect(result.rows[0].user_id).to.eq(FEMALE_USER.username)
        expect(result.rows[0].approved_by).to.eq(null)
      })
    })
  })

  describe('Supervisor Review', () => {
    const loginAsWomensSupervisorUser = ({
      youngOffender = false,
      indeterminateSentence = false,
    }: {
      youngOffender: boolean
      indeterminateSentence: boolean
    }) => {
      const sentenceStartDate11 = new Date('2019-01-28')
      const sentenceStartDate12 = new Date('2019-01-31')

      cy.task('stubSentenceData', {
        offenderNumbers: [offenderNo],
        bookingIds: [bookingId],
        startDates: [sentenceStartDate11, sentenceStartDate12],
      })

      if (youngOffender) {
        cy.task('stubUncategorisedAwaitingApprovalForWomenYOI', CASELOAD.PFI.id)
        cy.task('stubGetOffenderDetailsWomenYOI', { bookingId, category: 'I', youngOffender, indeterminateSentence })
      } else {
        cy.task('stubUncategorisedAwaitingApprovalWithLocation', CASELOAD.PFI.id)
        cy.task('stubGetOffenderDetailsWomen', { bookingId, category: 'R', youngOffender, indeterminateSentence })
      }

      cy.task('stubGetSocProfile', {
        offenderNo,
        category,
        transferToSecurity: false,
      })
      cy.task('stubGetExtremismProfile', {
        offenderNo,
        category,
        increasedRisk: false,
        notifyRegionalCTLead: false,
      })
      cy.task('stubAssessmentsWomen', { offenderNo })
      cy.task('stubAgencyDetails', { agency: CASELOAD.PFI.id })
      cy.task('stubSentenceDataGetSingle', { offenderNumber: offenderNo, formattedReleaseDate: '2014-11-23' })

      cy.stubLogin({
        user: WOMEN_SUPERVISOR_USER,
      })
      cy.signIn()
    }

    it('should require a supervisor decision', () => {
      dbSeeder(initialCategorisation())

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: false })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.startReviewForPrisoner(bookingId)
      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

      supervisorReviewPage.submitButton().click()

      supervisorReviewPage.validateErrorSummaryMessages([
        { index: 0, href: '#supervisorDecision', text: 'Select what you would like to do next' },
      ])

      supervisorReviewPage.validateErrorMessages([
        {
          selector: '#supervisorDecision-error',
          text: 'Select what you would like to do next',
        },
      ])
    })

    it('should allow a supervisor to approve a categorisation', () => {
      dbSeeder(initialCategorisation())

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: false })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.smartSurveyLink().should('be.visible')
      supervisorHomePage.startReviewForPrisoner(bookingId)

      cy.validateCategorisationDetails([
        // column 1
        [
          { key: 'Name', value: 'Hillmob, William' },
          { key: 'NOMIS ID', value: offenderNo },
          { key: 'Date of birth', value: '17/02/1970' },
          { key: 'Current category', value: 'Closed' },
        ],
        // column 2
        commonColumn2,
        // column 3
        [
          { key: 'HDC Eligibility Date', value: '10/06/2020' },
          { key: 'Automatic Release Date', value: '11/06/2020' },
          { key: 'Conditional Release Date', value: '02/02/2020' },
          { key: 'Parole Eligibility Date', value: '13/06/2020' },
          { key: 'Non Parole Date', value: '14/06/2020' },
          { key: 'ISP Tariff End Date', value: '15/06/2020' },
          { key: 'Licence Expiry Date', value: '16/06/2020' },
          { key: 'Sentence Expiry Date', value: '17/06/2020' },
          { key: 'Court-issued sentence', value: '6 years, 3 months (Std sentence)' },
        ],
      ])
      ;[
        // offending history
        { term: 'Previous Cat A, Restricted.', definition: 'No Cat A, Restricted' },
        { term: 'Previous convictions on NOMIS', definition: 'Libel (21/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Slander (22/02/2019 - 24/02/2019)' },
        { term: 'Previous convictions on NOMIS', definition: 'Undated offence' },
        { term: 'Relevant convictions on PNC', definition: 'No' },
        // safety and good order
        { term: 'Previous assaults in custody recorded', definition: '' },
        { term: 'Serious assaults in the past 12 months', definition: '' },
        { term: 'Any more information about risk of violence in custody', definition: 'No' },
        { term: 'Serious threats to good order in custody recorded', definition: 'No' },
        // risk of escape
        { term: 'Escape list', definition: 'No' },
        { term: 'Escape alerts', definition: 'No' },
        { term: 'Any other information that they pose an escape risk', definition: 'No' },
        { term: 'Any further details', definition: '' },
        // extremism
        { term: 'Identified at risk of engaging in, or vulnerable to, extremism', definition: 'No' },
        { term: 'Offences under terrorism legislation', definition: 'Yes' },
        // security information
        { term: 'Automatic referral to security team', definition: 'No' },
        { term: 'Manual referral to security team', definition: 'No' },
        { term: 'Flagged by security team', definition: 'No' },
        // category decision
        { term: 'What security category is most suitable for this person?', definition: 'Closed' },
        // next category review date
        { term: 'What date should they be reviewed by?', definition: 'Saturday 14 December 2019' },
      ].forEach(cy.checkDefinitionList)

      cy.task('stubSupervisorApprove')

      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

      supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
      supervisorReviewPage.submitButton().click()

      const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
      furtherInformationPage.enterFurtherInformation('Some further information')
      furtherInformationPage.submitButton().click()

      const supervisorReviewOutcomePage = SupervisorReviewOutcomePage.createForBookingIdAndCategorisationType(
        bookingId,
        CATEGORISATION_TYPE.INITIAL,
      )
      supervisorReviewOutcomePage.finishButton().should('be.visible')
    })

    it('should display the indeterminate sentence warning as appropriate', () => {
      dbSeeder(indeterminateSentenceWarning)

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: true })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.startReviewForPrisoner(bookingId)
      cy.validateCategorisationDetails([
        // column 1
        [
          { key: 'Name', value: 'Hillmob, William' },
          { key: 'NOMIS ID', value: offenderNo },
          { key: 'Date of birth', value: '17/02/1970' },
          { key: 'Current category', value: 'Closed' },
        ],
        // column 2
        commonColumn2,
        // column 3
        [
          { key: 'HDC Eligibility Date', value: '10/06/2020' },
          { key: 'Parole Eligibility Date', value: '13/06/2020' },
          { key: 'Non Parole Date', value: '14/06/2020' },
          { key: 'ISP Tariff End Date', value: '15/06/2020' },
          { key: 'Licence Expiry Date', value: '16/06/2020' },
          { key: 'Sentence Expiry Date', value: '17/06/2020' },
          { key: 'Court-issued sentence', value: 'Life (Std sentence)' },
        ],
      ])
      ;[
        // offending history
        { term: 'Previous Cat A, Restricted.', definition: 'No Cat A, Restricted' },
        { term: 'Previous convictions on NOMIS', definition: '' },
        { term: 'Relevant convictions on PNC', definition: 'No' },
        // safety and good order
        { term: 'Previous assaults in custody recorded', definition: '' },
        { term: 'Serious assaults in the past 12 months', definition: '' },
        { term: 'Any more information about risk of violence in custody', definition: 'No' },
        { term: 'Serious threats to good order in custody recorded', definition: 'No' },
        // risk of escape
        { term: 'Escape list', definition: 'No' },
        { term: 'Escape alerts', definition: 'No' },
        { term: 'Any other information that they pose an escape risk', definition: 'No' },
        { term: 'Any further details', definition: '' },
        // extremism
        { term: 'Identified at risk of engaging in, or vulnerable to, extremism', definition: 'No' },
        { term: 'Offences under terrorism legislation', definition: 'Yes' },
        // security information
        { term: 'Automatic referral to security team', definition: 'No' },
        { term: 'Manual referral to security team', definition: 'No' },
        { term: 'Flagged by security team', definition: 'No' },
        // category decision
        { term: 'What security category is most suitable for this person?', definition: 'Closed' },
        // next category review date
        { term: 'What date should they be reviewed by?', definition: 'Saturday 14 December 2019' },
      ].forEach(cy.checkDefinitionList)

      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)
      supervisorReviewPage.validateIndeterminateWarningIsDisplayed({
        isVisible: false,
      })
      supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_T').click()
      supervisorReviewPage.validateIndeterminateWarningIsDisplayed({
        isVisible: true,
        expectedText: `This person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.`,
      })
    })

    it('should allow a supervisor to override to closed without passing back to a categoriser', () => {
      dbSeeder(initialCategorisation('T'))

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: false })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.startReviewForPrisoner(bookingId)
      cy.task('stubSupervisorApprove')

      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

      supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_R').click()
      supervisorReviewPage.submitButton().click()

      const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(bookingId, 'Closed')
      giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('NO')
      cy.get('#supervisorOverriddenCategoryText').type('some justification of category change')
      giveBackToCategoriserPage.submitButton().click()

      const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
      furtherInformationPage.enterFurtherInformation('Some further information')
      furtherInformationPage.submitButton().click()

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.APPROVED.name)
        expect(result.rows[0].form_response.supervisor).to.deep.eq({
          review: {
            supervisorDecision: 'changeCategoryTo_R',
            supervisorOverriddenCategory: 'R',
            supervisorCategoryAppropriate: 'No',
          },
          changeCategory: {
            giveBackToCategoriser: 'No',
            supervisorOverriddenCategoryText: 'some justification of category change'
          },
          furtherInformation: {
            otherInformationText: 'Some further information'
          }
        })
        expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
        expect(result.rows[0].approved_by).to.eq(WOMEN_SUPERVISOR_USER.username)
      })
    })

    it('should allow a supervisor to override to open, having to pass back to a categoriser to complete open conditions', () => {
      dbSeeder(initialCategorisation())

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: false })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.startReviewForPrisoner(bookingId)
      cy.task('stubSupervisorReject')

      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

      supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_T').click()
      supervisorReviewPage.submitButton().click()

      const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
      supervisorConfirmBackPage.saveAndReturnButton().click()

      supervisorReviewPage.validateErrorSummaryMessages([
        { index: 0, href: '#messageText', text: 'Enter your message for the categoriser' },
      ])

      supervisorReviewPage.validateErrorMessages([
        {
          selector: '#messageText-error',
          text: 'Enter your message for the categoriser',
        },
      ])

      supervisorConfirmBackPage.setConfirmationMessageText('A reason why I believe this is a more appropriate category')
      supervisorConfirmBackPage.saveAndReturnButton().click()

      const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
        bookingId,
        CATEGORISATION_TYPE.INITIAL,
      )
      giveBackToCategoriserOutcomePage.finishButton().should('be.visible')
      giveBackToCategoriserOutcomePage.dcsSurveyLink().should('be.visible')

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
        expect(result.rows[0].form_response.supervisor).to.deep.eq({
          review: {
            supervisorDecision: 'changeCategoryTo_T',
              supervisorOverriddenCategory: 'T',
              supervisorCategoryAppropriate: 'No',
          },
          confirmBack: {
            supervisorName: 'Ex12 Officer6',
              messageText: 'A reason why I believe this is a more appropriate category',
          },
        },)
        expect(result.rows[0].form_response.openConditionsRequested).to.eq(true)
        expect(result.rows[0].form_response.ratings.decision).to.eq(undefined)
      })
    })

    it('should allow a supervisor to request more information from the categoriser', () => {
      dbSeeder(initialCategorisation())

      loginAsWomensSupervisorUser({ youngOffender: false, indeterminateSentence: false })

      const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
      supervisorHomePage.startReviewForPrisoner(bookingId)
      cy.task('stubSupervisorReject')

      const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

      supervisorReviewPage.supervisorDecisionRadioButton('GIVE_BACK_TO_CATEGORISER').click()
      supervisorReviewPage.submitButton().click()

      const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
      supervisorConfirmBackPage.saveAndReturnButton().click()

      supervisorReviewPage.validateErrorSummaryMessages([
        { index: 0, href: '#messageText', text: 'Enter your message for the categoriser' },
      ])

      supervisorReviewPage.validateErrorMessages([
        {
          selector: '#messageText-error',
          text: 'Enter your message for the categoriser',
        },
      ])

      supervisorConfirmBackPage.setConfirmationMessageText('Give me more information')
      supervisorConfirmBackPage.saveAndReturnButton().click()

      const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
        bookingId,
        CATEGORISATION_TYPE.INITIAL,
      )
      giveBackToCategoriserOutcomePage.finishButton().should('be.visible')
      giveBackToCategoriserOutcomePage.dcsSurveyLink().should('be.visible')

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
        expect(result.rows[0].form_response).to.deep.eq({
          ratings: {
            decision: { category: 'R' },
            escapeRating: { escapeOtherEvidence: 'No' },
            securityInput: { securityInputNeeded: 'No' },
            nextReviewDate: { date: '14/12/2019' },
            violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
            extremismRating: { previousTerrorismOffences: 'Yes' },
            offendingHistory: { previousConvictions: 'No' },
          },
          supervisor: {
            review: {
              supervisorDecision: 'requestMoreInformation'
            },
            confirmBack: {
              messageText: 'Give me more information',
              supervisorName: "Ex12 Officer6",
            }
          },
          categoriser: { provisionalCategory: { suggestedCategory: 'R', categoryAppropriate: 'Yes' } }
        })
      })
    })

    describe('Young Offenders (YOI)', () => {
      let supervisorReviewPage: SupervisorReviewPage

      describe('form submission', () => {
        beforeEach(() => {
          offenderNo = 'C0001AA'
          bookingId = 21
          dbSeeder(femaleYoungOffenders)

          loginAsWomensSupervisorUser({
            youngOffender: true,
            indeterminateSentence: true,
          })

          const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
          supervisorHomePage.startReviewForPrisoner(bookingId)
          cy.validateCategorisationDetails([
            // column 1
            [
              { key: 'Name', value: 'Tim, Tiny' },
              { key: 'NOMIS ID', value: offenderNo },
              { key: 'Date of birth', value: '01/01/2005' },
              { key: 'Current category', value: 'YOI closed' },
            ],
            // column 2
            commonColumn2,
            // column 3
            [
              { key: 'HDC Eligibility Date', value: '10/06/2020' },
              { key: 'Parole Eligibility Date', value: '13/06/2020' },
              { key: 'Non Parole Date', value: '14/06/2020' },
              { key: 'ISP Tariff End Date', value: '15/06/2020' },
              { key: 'Licence Expiry Date', value: '16/06/2020' },
              { key: 'Sentence Expiry Date', value: '17/06/2020' },
              { key: 'Court-issued sentence', value: 'Life (Std sentence)' },
            ],
          ])
          ;[
            // offending history
            { term: 'Previous Cat A, Restricted.', definition: 'No Cat A, Restricted' },
            { term: 'Previous convictions on NOMIS', definition: '' },
            { term: 'Relevant convictions on PNC', definition: 'No' },
            // safety and good order
            { term: 'Previous assaults in custody recorded', definition: '' },
            { term: 'Serious assaults in the past 12 months', definition: '' },
            { term: 'Any more information about risk of violence in custody', definition: 'No' },
            { term: 'Serious threats to good order in custody recorded', definition: 'No' },
            // risk of escape
            { term: 'Escape list', definition: 'No' },
            { term: 'Escape alerts', definition: 'No' },
            { term: 'Any other information that they pose an escape risk', definition: 'No' },
            { term: 'Any further details', definition: '' },
            // extremism
            { term: 'Identified at risk of engaging in, or vulnerable to, extremism', definition: 'No' },
            { term: 'Offences under terrorism legislation', definition: 'Yes' },
            // security information
            { term: 'Automatic referral to security team', definition: 'No' },
            { term: 'Manual referral to security team', definition: 'No' },
            { term: 'Flagged by security team', definition: 'No' },
            // category decision
            { term: 'What security category is most suitable for this person?', definition: 'YOI closed' },
            // next category review date
            { term: 'What date should they be reviewed by?', definition: 'Saturday 14 December 2019' },
          ].forEach(cy.checkDefinitionList)

          supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)
          supervisorReviewPage.validateIndeterminateWarningIsDisplayed({ isVisible: false })
          supervisorReviewPage.validateWhichCategoryIsMoreAppropriateRadioButton({
            selection: ['CHANGE_TO_CATEGORY_J', 'CHANGE_TO_CATEGORY_R'],
            isChecked: false,
          })
        })

        it('should require a provisional category selection', () => {
          supervisorReviewPage.submitButton().click()

          supervisorReviewPage.validateErrorSummaryMessages([
            { index: 0, href: '#supervisorDecision', text: 'Select what you would like to do next' },
          ])

          supervisorReviewPage.validateErrorMessages([
            {
              selector: '#supervisorDecision-error',
              text: 'Select what you would like to do next',
            },
          ])
        })

        it('should accept an agreement with the provisional category', () => {
          cy.task('stubSupervisorApprove')

          supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
          supervisorReviewPage.submitButton().click()

          const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
          furtherInformationPage.enterFurtherInformation('Some further information')
          furtherInformationPage.submitButton().click()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].status).to.eq(Status.APPROVED.name)
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: {
                decision: { category: 'I' },
                escapeRating: { escapeOtherEvidence: 'No' },
                securityInput: { securityInputNeeded: 'No' },
                nextReviewDate: { date: '14/12/2019' },
                violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
                extremismRating: { previousTerrorismOffences: 'Yes' },
                offendingHistory: { previousConvictions: 'No' },
              },
              supervisor: { review: { supervisorDecision: 'agreeWithCategoryDecision' }, furtherInformation: { otherInformationText: 'Some further information' } },
              categoriser: { provisionalCategory: { suggestedCategory: 'I', categoryAppropriate: 'Yes' } },
            })
            expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
            expect(result.rows[0].approved_by).to.eq(WOMEN_SUPERVISOR_USER.username)
          })
        })

        it('should allow the supervisor to return the categorisation request to the categoriser', () => {
          cy.task('stubSupervisorReject')
          const confirmBackMessage = 'a message to pass back to the categoriser'

          supervisorReviewPage.supervisorDecisionRadioButton('GIVE_BACK_TO_CATEGORISER').click()
          supervisorReviewPage.submitButton().click()

          const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
          supervisorConfirmBackPage.setConfirmationMessageText(confirmBackMessage)
          supervisorConfirmBackPage.saveAndReturnButton().click()

          const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
            bookingId,
            CATEGORISATION_TYPE.INITIAL,
          )
          giveBackToCategoriserOutcomePage.finishButton().should('be.visible')
          giveBackToCategoriserOutcomePage.dcsSurveyLink().should('be.visible')

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
            expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
            expect(result.rows[0].approved_by).to.eq(null)
            expect(result.rows[0].form_response.supervisor.confirmBack.messageText).to.eq(confirmBackMessage)
          })
        })

        describe('Do you agree with the provisional category? No', () => {
          describe('YOI Open', () => {
            it('should return the category change to the categoriser to provide the Open information', () => {
              cy.task('stubSupervisorReject')

              supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_J').click()
              supervisorReviewPage.validateIndeterminateWarningIsDisplayed({
                isVisible: true,
                expectedText: `This person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.`,
              })
              supervisorReviewPage.submitButton().click()

              const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
              supervisorConfirmBackPage.setConfirmationMessageText('A reason why I believe this is a more appropriate category')
              supervisorConfirmBackPage.saveAndReturnButton().click()

              const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
                bookingId,
                CATEGORISATION_TYPE.INITIAL,
              )
              giveBackToCategoriserOutcomePage.finishButton().should('be.visible')
              giveBackToCategoriserOutcomePage.dcsSurveyLink().should('be.visible')

              cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
                expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
                expect(result.rows[0].form_response).to.deep.eq({
                  ratings: {
                    escapeRating: {
                      escapeOtherEvidence: 'No',
                    },
                    securityInput: {
                      securityInputNeeded: 'No',
                    },
                    nextReviewDate: {
                      date: '14/12/2019',
                    },
                    violenceRating: {
                      seriousThreat: 'No',
                      highRiskOfViolence: 'No',
                    },
                    extremismRating: {
                      previousTerrorismOffences: 'Yes',
                    },
                    offendingHistory: {
                      previousConvictions: 'No',
                    },
                  },
                  supervisor: {
                    review: {
                      supervisorDecision: 'changeCategoryTo_J',
                      supervisorOverriddenCategory: 'J',
                      supervisorCategoryAppropriate: 'No',
                    },
                    confirmBack: {
                      supervisorName: 'Ex12 Officer6',
                      messageText: 'A reason why I believe this is a more appropriate category',
                    },
                  },
                  categoriser: {
                    provisionalCategory: {
                      categoryAppropriate: 'Yes',
                    },
                  },
                  openConditionsRequested: true,
                })
                expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
                expect(result.rows[0].approved_by).to.eq(null)
              })
            })
          })

          describe('Consider for closed', () => {
            it('without giving back to categoriser', () => {
              cy.task('stubSupervisorApprove')

              supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_R').click()
              supervisorReviewPage.validateIndeterminateWarningIsDisplayed({ isVisible: false })
              supervisorReviewPage.submitButton().click()

              const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(bookingId, 'Closed')
              giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('NO')
              cy.get('#supervisorOverriddenCategoryText').type('some justification of category change')
              giveBackToCategoriserPage.submitButton().click()

              const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
              furtherInformationPage.enterFurtherInformation('A reason why I believe this is a more appropriate category')
              furtherInformationPage.submitButton().click()

              const supervisorReviewOutcomePage = SupervisorReviewOutcomePage.createForBookingIdAndCategorisationType(
                bookingId,
                CATEGORISATION_TYPE.INITIAL,
              )
              supervisorReviewOutcomePage.finishButton().should('be.visible')

              cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
                expect(result.rows[0].status).to.eq(Status.APPROVED.name)
                expect(result.rows[0].assigned_user_id).to.eq(FEMALE_USER.username)
                expect(result.rows[0].approved_by).to.eq(WOMEN_SUPERVISOR_USER.username)
                expect(result.rows[0].form_response).to.deep.eq({
                  ratings: {
                    decision: {
                      category: 'I',
                    },
                    escapeRating: {
                      escapeOtherEvidence: 'No',
                    },
                    securityInput: {
                      securityInputNeeded: 'No',
                    },
                    nextReviewDate: {
                      date: '14/12/2019',
                    },
                    violenceRating: {
                      seriousThreat: 'No',
                      highRiskOfViolence: 'No',
                    },
                    extremismRating: {
                      previousTerrorismOffences: 'Yes',
                    },
                    offendingHistory: {
                      previousConvictions: 'No',
                    },
                  },
                  supervisor: {
                    review: {
                      supervisorDecision: 'changeCategoryTo_R',
                      supervisorOverriddenCategory: 'R',
                      supervisorCategoryAppropriate: 'No',
                    },
                    changeCategory: {
                      giveBackToCategoriser: 'No',
                      supervisorOverriddenCategoryText: 'some justification of category change'
                    },
                    furtherInformation: {
                      otherInformationText: 'A reason why I believe this is a more appropriate category',
                    }
                  },
                  categoriser: {
                    provisionalCategory: {
                      suggestedCategory: 'I',
                      categoryAppropriate: 'Yes',
                    },
                  },
                })
              })
            })
          })
        })
      })
    })
  })
})
