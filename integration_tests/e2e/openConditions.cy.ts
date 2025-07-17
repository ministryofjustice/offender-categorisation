import { CATEGORISER_USER, RECATEGORISER_USER, SUPERVISOR_USER } from '../factory/user'
import STATUS from '../../server/utils/statusEnum'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import ProvisionalCategoryPage from '../pages/form/categoriser/provisionalCategory'
import Page from '../pages/page'
import TaskListPage from '../pages/taskList/taskList'
import TprsPage from '../pages/form/openConditions/tprs'
import EarliestReleaseDatePage from '../pages/form/openConditions/earliestReleaseDate'
import PreviousSentencesPage from '../pages/form/openConditions/previousSentences'
import VictimContactSchemePage from '../pages/form/openConditions/victimContactScheme'
import SexualOffencesPage from '../pages/form/openConditions/sexualOffences'
import ForeignNationalPage from '../pages/form/openConditions/foreignNational'
import RiskOfSeriousHarmPage from '../pages/form/openConditions/riskOfSeriousHarm'
import FurtherChargesPage from '../pages/form/ratings/furtherCharges'
import RiskLevelsPage from '../pages/form/openConditions/riskLevels'
import CategoriserReviewCYAPage from '../pages/form/categoriser/review'
import CategoriserSubmittedPage from '../pages/taskList/categoriserSubmitted'
import SupervisorHomePage from '../pages/supervisor/home'
import SupervisorReviewPage from '../pages/form/supervisor/review'
import SupervisorReviewOutcomePage from '../pages/form/supervisor/outcome'
import SupervisorDonePage from '../pages/supervisor/done'
import ApprovedViewPage from '../pages/form/approvedView'
import CategoriserHomePage from '../pages/categoriser/home'
import SupervisorMessagePage from '../pages/form/supervisor/message'
import CategoriserAwaitingApprovalViewPage from '../pages/categoriser/awaitingapproval'
import OpenConditionsAdded from '../pages/openConditionsAdded'
import OpenConditionsNotRecommended from '../pages/form/openConditions/notRecommendedPage'
import ProvisionalCategoryOpenPage from '../pages/form/categoriser/provisionalOpenCategory'

describe('Open conditions', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
  let today: Date

  let provisionalCategoryPage: ProvisionalCategoryPage
  let categoriserHomePage: CategoriserHomePage
  let taskListPage: TaskListPage
  let categoriserReviewCYAPage: CategoriserReviewCYAPage

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')

    sentenceStartDates = {
      B2345XY: new Date(),
      B2345YZ: new Date(),
    }

    today = new Date()

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'dummy',
      sequenceNumber: 5,
      status: STATUS.SECURITY_BACK.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'C',
            overriddenCategory: 'D',
            categoryAppropriate: 'No',
            otherInformationText: 'over ridden category text',
          },
        },
        ratings: {
          offendingHistory: {
            previousConvictions: 'Yes',
            previousConvictionsText: 'some convictions',
          },
          securityInput: {
            securityInputNeeded: 'No',
          },
          furtherCharges: {
            furtherCharges: 'Yes',
            furtherChargesText: 'some charges',
          },
          violenceRating: {
            highRiskOfViolence: 'No',
            seriousThreat: 'Yes',
          },
          escapeRating: {
            escapeOtherEvidence: 'Yes',
            escapeOtherEvidenceText: 'evidence details',
            escapeCatB: 'Yes',
            escapeCatBText: 'cat b details',
          },
          extremismRating: {
            previousTerrorismOffences: 'Yes',
          },
          nextReviewDate: {
            date: '14/12/2019',
          },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    })
    setUpStubs()

    setUpProfiles()

    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(12, 'Edit')

    taskListPage = TaskListPage.createForBookingId(12)
    taskListPage.continueReviewAndCategorisationButton(12).click()
    categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(12, 'you continue')
    categoriserReviewCYAPage.continueButton('Continue').click()
    provisionalCategoryPage = ProvisionalCategoryPage.createForBookingId(12)
  })

  it('The happy path is correct for categoriser overriding to D, all yeses, then cancelling open conditions', () => {
    provisionalCategoryPage.appropriateNo().click()
    provisionalCategoryPage.overriddenCategoryD().click()
    provisionalCategoryPage.setJustificationText('categoriser relevant info 1')
    provisionalCategoryPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToTasklistButton(12).click()

    taskListPage.openConditionsButton().should('exist')
    taskListPage.openConditionsButton().click()

    const tprsPage = Page.verifyOnPage(TprsPage)
    tprsPage.continueButton().click()

    tprsPage.validateErrorSummaryMessages([{ index: 0, href: '#tprsSelected', text: 'Please select yes or no' }])

    tprsPage.validateErrorMessages([{ selector: '#tprsSelected-error', text: 'Please select yes or no' }])
    tprsPage.selectTprsRadioButton('YES')
    tprsPage.continueButton().click()

    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.continueButton().click()

    earliestReleasePage.assertTextVisibilityOnPage({
      selector: 'div',
      text: 'Is it 5 or more years to their earliest release date?',
    })
    earliestReleasePage.assertTextVisibilityOnPage({
      selector: 'div',
      text: 'If they have 5 or more years to their earliest release date you will need to provide a reason to justify sending them to open conditions now.',
    })

    earliestReleasePage.validateErrorSummaryMessages([
      { index: 0, href: '#fiveOrMoreYears', text: 'Please select yes or no' },
    ])
    earliestReleasePage.validateErrorMessages([{ selector: '#fiveOrMoreYears-error', text: 'Please select yes or no' }])

    earliestReleasePage.selectEarliestReleaseDateRadioButton('YES')
    earliestReleasePage.continueButton().click()

    earliestReleasePage.validateErrorSummaryMessages([{ index: 0, href: '#justify', text: 'Please select yes or no' }])
    earliestReleasePage.validateErrorMessages([{ selector: '#justify-error', text: 'Please select yes or no' }])

    earliestReleasePage.selectJustifyRadioButton('YES')
    earliestReleasePage.continueButton().click()

    earliestReleasePage.validateErrorSummaryMessages([{ index: 0, href: '#justifyText', text: 'Please enter details' }])
    earliestReleasePage.validateErrorMessages([
      { selector: '#justifyText-error', text: '\n        \n        Error: Please enter details\n        \n      ' },
    ])
    earliestReleasePage.setJustifyOpenConditionsTextInput('justify details text')
    earliestReleasePage.continueButton().click()

    const previousSentencesPage = Page.verifyOnPage(PreviousSentencesPage)
    previousSentencesPage.selectPreviousSentencesRadioButton('NO')
    previousSentencesPage.continueButton().click()

    const victimContactSchemePage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemePage.continueButton().click()

    victimContactSchemePage.validateErrorSummaryMessages([
      {
        index: 0,
        href: '#vcsOptedFor',
        text: 'Select if any victims of the crime have opted-in to the Victim Contact Scheme (VCS)',
      },
    ])
    victimContactSchemePage.validateErrorMessages([
      {
        selector: '#vcsOptedFor-error',
        text: '\n      \n      Error: Select if any victims of the crime have opted-in to the Victim Contact Scheme (VCS)\n      \n    ',
      },
    ])
    victimContactSchemePage.selectVictimContactSchemeRadioButton('YES')
    victimContactSchemePage.continueButton().click()

    victimContactSchemePage.continueButton().click()

    victimContactSchemePage.validateErrorSummaryMessages([
      { index: 0, href: '#vloResponseText', text: 'Enter the response from the Victim Liaison Officer (VLO)' },
    ])
    victimContactSchemePage.validateErrorMessages([
      {
        selector: '#vloResponseText-error',
        text: '\n      \n      Error: Enter the response from the Victim Liaison Officer (VLO)\n      \n    ',
      },
    ])
    victimContactSchemePage.setVictimLiaisonOfficerResponseTextInput('vlo response details text')
    victimContactSchemePage.continueButton().click()

    const sexualOffencesPage = Page.verifyOnPage(SexualOffencesPage)
    sexualOffencesPage.selectSexualOffencesRadioButton('NO')
    sexualOffencesPage.continueButton().click()

    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
    foreignNationalPage.continueButton().click()

    foreignNationalPage.validateErrorSummaryMessages([
      { index: 0, href: '#isForeignNational', text: 'Please select yes or no' },
    ])
    foreignNationalPage.validateErrorMessages([
      { selector: '#isForeignNational-error', text: '\n      \n      Error: Please select yes or no\n      \n    ' },
    ])
    foreignNationalPage.selectForeignNationalRadioButton('YES')
    foreignNationalPage.continueButton().click()

    foreignNationalPage.validateErrorSummaryMessages([
      { index: 0, href: '#formCompleted', text: 'Please select yes or no' },
    ])
    foreignNationalPage.validateErrorMessages([
      {
        selector: '#formCompleted-error',
        text: '\n        \n        Error: Please select yes or no\n        \n      ',
      },
    ])

    foreignNationalPage.selectHomeOfficeImmigrationStatusRadioButton('YES')
    foreignNationalPage.continueButton().click()

    foreignNationalPage.validateErrorSummaryMessages([
      { index: 0, href: '#dueDeported', text: 'Please select yes or no' },
    ])
    foreignNationalPage.validateErrorMessages([
      {
        selector: '#dueDeported-error',
        text: '\n          \n          Error: Please select yes or no\n          \n        ',
      },
    ])

    foreignNationalPage.selectLiabilityToBeDeportedRadioButton('YES')
    foreignNationalPage.continueButton().click()

    foreignNationalPage.validateErrorSummaryMessages([
      { index: 0, href: '#exhaustedAppeal', text: 'Please select yes or no' },
    ])
    foreignNationalPage.validateErrorMessages([
      {
        selector: '#exhaustedAppeal-error',
        text: '\n            \n            Error: Please select yes or no\n            \n          ',
      },
    ])

    foreignNationalPage.selectExhaustedAppealRadioButton('NO')
    foreignNationalPage.continueButton().click()

    const riskOfSeriousHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfSeriousHarmPage.continueButton().click()
    riskOfSeriousHarmPage.validateErrorSummaryMessages([
      { index: 0, href: '#seriousHarm', text: 'Please select yes or no' },
    ])
    /*
    riskOfSeriousHarmPage.validateErrorMessages([{ selector: '#seriousHarm-error', text: '\n            \n            Error: Please select yes or no\n            \n          ' }])
*/

    riskOfSeriousHarmPage.selectRiskOfSeriousHarmRadioButton('YES')
    riskOfSeriousHarmPage.continueButton().click()

    riskOfSeriousHarmPage.validateErrorSummaryMessages([
      { index: 0, href: '#harmManaged', text: 'Please select yes or no' },
    ])
    riskOfSeriousHarmPage.validateErrorMessages([
      { selector: '#harmManaged-error', text: '\n        \n        Error: Please select yes or no\n        \n      ' },
    ])

    riskOfSeriousHarmPage.selectManageInOpenConditionsRadioButton('YES')
    riskOfSeriousHarmPage.continueButton().click()
    riskOfSeriousHarmPage.validateErrorSummaryMessages([
      { index: 0, href: '#harmManagedText', text: 'Please enter details' },
    ])
    /*
    riskOfSeriousHarmPage.validateErrorMessages([{ selector: '#harmManagedText-error', text: '\n        \n        Error: Please select yes or no\n        \n      ' }])
*/
    riskOfSeriousHarmPage.setManageRiskTextInput('harmManagedText details')
    riskOfSeriousHarmPage.continueButton().click()

    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.clearFurtherChargesCategoryBAppropriateText()
    furtherChargesPage.continue().click()

    furtherChargesPage.validateErrorSummaryMessages([
      { index: 0, href: '#furtherChargesText', text: 'Please enter details' },
      { index: 1, href: '#increasedRisk', text: 'Please select yes or no' },
    ])
    furtherChargesPage.validateErrorMessages([
      { selector: '#furtherChargesText-error', text: '\n    \n    Error: Please enter details\n    \n  ' },
      { selector: '#increasedRisk-error', text: '\n      \n      Error: Please select yes or no\n      \n    ' },
    ])
    furtherChargesPage.setFurtherChargesCategoryBAppropriateText('furtherChargesText details')
    furtherChargesPage.continue().click()

    furtherChargesPage.selectIncreasedRiskRadioButton('YES')
    furtherChargesPage.continue().click()

    const riskLevelsPage = Page.verifyOnPage(RiskLevelsPage)
    riskLevelsPage.continueButton().click()

    riskLevelsPage.validateErrorSummaryMessages([
      { index: 0, href: '#likelyToAbscond', text: 'Please select yes or no' },
    ])
    riskOfSeriousHarmPage.validateErrorMessages([
      { selector: '#likelyToAbscond-error', text: '\n      \n      Error: Please select yes or no\n      \n    ' },
    ])
    riskLevelsPage.selectRiskLevelsRadioButton('YES')
    riskLevelsPage.continueButton().click()

    riskLevelsPage.validateErrorSummaryMessages([
      { index: 0, href: '#likelyToAbscondText', text: 'Please enter details' },
    ])
    riskOfSeriousHarmPage.validateErrorMessages([
      { selector: '#likelyToAbscondText-error', text: '\n      \n      Error: Please enter details\n      \n    ' },
    ])
    riskLevelsPage.setLikelyToAbscondTextInput('likelyToAbscondText details')
    riskLevelsPage.continueButton().click()

    const openConditionsNotRecommendedPage = Page.verifyOnPage(OpenConditionsNotRecommended)
    openConditionsNotRecommendedPage.validateNotSuitableReasons([
      'They have further charges which pose an increased risk in open conditions',
      'They are likely to abscond or otherwise abuse the lower security of open conditions',
    ])
    openConditionsNotRecommendedPage.selectStillReferRadioButton('NO')
    openConditionsNotRecommendedPage.continueButton().click()

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [new Date().setDate(new Date().getDate() - 4), new Date().setDate(new Date().getDate() - 1)],
    })

    const taskListPage1 = Page.verifyOnPage(TaskListPage)
    taskListPage1.openConditionsButton().should('not.exist')

    taskListPage1.continueReviewAndCategorisationButton(12).click()

    categoriserReviewCYAPage.changeLinks().should('have.length', 10)

    categoriserReviewCYAPage.validateOffendingHistorySummary([
      { question: 'Previous Cat A, Restricted.', expectedAnswer: 'Cat A (2012)' },
      {
        question: 'Previous convictions on NOMIS',
        expectedAnswer: 'Libel (21/02/2019) Slander (22/02/2019 - 24/02/2019) Undated offence',
      },
      { question: 'Relevant convictions on PNC', expectedAnswer: 'Yes some convictions' },
    ])

    categoriserReviewCYAPage.validateFurtherChargesSummary([
      { question: 'Further serious charges', expectedAnswer: 'Yes some charges' },
      { question: 'Warrant category B?', expectedAnswer: '' },
    ])

    categoriserReviewCYAPage.validateViolenceRatingSummary([
      { question: 'Previous assaults in custody recorded', expectedAnswer: '5' },
      { question: 'Serious assaults in the past 12 months', expectedAnswer: '2' },
      { question: 'Any more information about risk of violence in custody', expectedAnswer: 'No' },
      { question: 'Serious threats to good order in custody recorded', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateEscapeRatingSummary([
      { question: 'Escape list', expectedAnswer: 'No' },
      { question: 'Escape alerts', expectedAnswer: 'Yes' },
      { question: 'Any other information that they pose an escape risk', expectedAnswer: 'Yes evidence details' },
      { question: 'Any further details', expectedAnswer: 'Yes cat b details' },
    ])

    categoriserReviewCYAPage.validateExtremismRatingSummary([
      { question: 'Identified at risk of engaging in, or vulnerable to, extremism', expectedAnswer: 'Yes' },
      { question: 'Offences under terrorism legislation', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateSecurityInputSummary([
      { question: 'Automatic referral to security team', expectedAnswer: 'No' },
      { question: 'Manual referral to security team', expectedAnswer: 'No' },
      { question: 'Flagged by security team', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.validateNextReviewDateSummary([
      { question: 'What date should they be reviewed by?', expectedAnswer: 'Saturday 14 December 2019' },
    ])
  })

  it('The happy path is correct for categoriser overriding to D, all no', () => {
    provisionalCategoryPage.appropriateNo().click()
    provisionalCategoryPage.overriddenCategoryD().click()
    provisionalCategoryPage.setJustificationText('categoriser relevant info 1')
    provisionalCategoryPage.indeterminateWarning().should('not.exist')
    provisionalCategoryPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToTasklistButton(12).click()

    completeOpenConditionsWorkflow(taskListPage)

    taskListPage.openConditionsButton().should('exist')
    taskListPage.continueReviewAndCategorisationButton(12, 'Continue').click()

    categoriserReviewCYAPage.validateOffendingHistorySummary([
      { question: 'Previous Cat A, Restricted.', expectedAnswer: 'Cat A (2012)' },
      {
        question: 'Previous convictions on NOMIS',
        expectedAnswer: 'Libel (21/02/2019) Slander (22/02/2019 - 24/02/2019) Undated offence',
      },
      { question: 'Relevant convictions on PNC', expectedAnswer: 'Yes some convictions' },
    ])

    categoriserReviewCYAPage.validateFurtherChargesSummary([
      { question: 'Further serious charges', expectedAnswer: 'Yes some charges' },
      { question: 'Warrant category B?', expectedAnswer: '' },
    ])

    categoriserReviewCYAPage.validateViolenceRatingSummary([
      { question: 'Previous assaults in custody recorded', expectedAnswer: '5' },
      { question: 'Serious assaults in the past 12 months', expectedAnswer: '2' },
      { question: 'Any more information about risk of violence in custody', expectedAnswer: 'No' },
      { question: 'Serious threats to good order in custody recorded', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateEscapeRatingSummary([
      { question: 'Escape list', expectedAnswer: 'No' },
      { question: 'Escape alerts', expectedAnswer: 'Yes' },
      { question: 'Any other information that they pose an escape risk', expectedAnswer: 'Yes evidence details' },
      { question: 'Any further details', expectedAnswer: 'Yes cat b details' },
    ])

    categoriserReviewCYAPage.validateExtremismRatingSummary([
      { question: 'Identified at risk of engaging in, or vulnerable to, extremism', expectedAnswer: 'Yes' },
      { question: 'Offences under terrorism legislation', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateSecurityInputSummary([
      { question: 'Automatic referral to security team', expectedAnswer: 'No' },
      { question: 'Manual referral to security team', expectedAnswer: 'No' },
      { question: 'Flagged by security team', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.validateNextReviewDateSummary([
      { question: 'What date should they be reviewed by?', expectedAnswer: 'Saturday 14 December 2019' },
    ])

    categoriserReviewCYAPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.victimContactSchemeDl().should('exist')

    categoriserReviewCYAPage.validateVictimContactSchemeSummary([
      {
        question: 'Does this prisoner have any victims opted in to the Victim Contact Scheme (VCS)?',
        expectedAnswer: 'No',
      },
    ])

    categoriserReviewCYAPage.validatePreviousSentencesSummary([
      { question: 'Have they been released from a previous sentence in the last 5 years?', expectedAnswer: 'No' },
      { question: 'Was that previous sentence for 7 years or more?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateSexualOffencesSummarySummary([
      { question: 'Have they ever been convicted of a sexual offence?', expectedAnswer: 'No' },
      { question: 'Can the risk to the public be managed in open conditions?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateForeignNationalSummary([
      { question: 'Are they a foreign national?', expectedAnswer: 'No' },
      { question: 'Have the Home Office confirmed their immigration status?', expectedAnswer: 'Not applicable' },
      { question: 'Do they have a liability for deportation?', expectedAnswer: 'Not applicable' },
      { question: 'Have they been through all appeals process in the UK?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateRiskOfHarmSummary([
      { question: 'Risk of serious harm to the public?', expectedAnswer: 'No' },
      { question: 'Can this risk be managed?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateFurtherChargesOpenSummary([
      { question: 'Are they facing any further charges?', expectedAnswer: 'Yes' },
      { question: 'Further charges details', expectedAnswer: 'some chargesfurtherChargesText details' },
      { question: 'Do these further charges increase risk in open conditions?', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.validateRiskLevelSummary([
      { question: 'Likely to abscond or abuse open conditions?', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.continueButton('Continue').click()

    provisionalCategoryPage.indeterminateWarning().should('not.exist')
    provisionalCategoryPage.warning().contains('The provisional category is open')

    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    provisionalCategoryPage.openConditionsAppropriateYes().click()
    provisionalCategoryPage.submitButton().click()
  })

  it('The happy path is correct for categoriser overriding to D, all no 3 to 5 policy change', () => {
    provisionalCategoryPage.appropriateNo().click()
    provisionalCategoryPage.overriddenCategoryD().click()
    provisionalCategoryPage.setJustificationText('categoriser relevant info 1')
    provisionalCategoryPage.indeterminateWarning().should('not.exist')
    provisionalCategoryPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToTasklistButton(12).click()

    completeOpenConditionsWorkflow(taskListPage)

    taskListPage.openConditionsButton().should('exist')
    taskListPage.continueReviewAndCategorisationButton(12, 'Continue').click()

    categoriserReviewCYAPage.validateOffendingHistorySummary([
      { question: 'Previous Cat A, Restricted.', expectedAnswer: 'Cat A (2012)' },
      {
        question: 'Previous convictions on NOMIS',
        expectedAnswer: 'Libel (21/02/2019) Slander (22/02/2019 - 24/02/2019) Undated offence',
      },
      { question: 'Relevant convictions on PNC', expectedAnswer: 'Yes some convictions' },
    ])

    categoriserReviewCYAPage.validateFurtherChargesSummary([
      { question: 'Further serious charges', expectedAnswer: 'Yes some charges' },
      { question: 'Warrant category B?', expectedAnswer: '' },
    ])

    categoriserReviewCYAPage.validateViolenceRatingSummary([
      { question: 'Previous assaults in custody recorded', expectedAnswer: '5' },
      { question: 'Serious assaults in the past 12 months', expectedAnswer: '2' },
      { question: 'Any more information about risk of violence in custody', expectedAnswer: 'No' },
      { question: 'Serious threats to good order in custody recorded', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateEscapeRatingSummary([
      { question: 'Escape list', expectedAnswer: 'No' },
      { question: 'Escape alerts', expectedAnswer: 'Yes' },
      { question: 'Any other information that they pose an escape risk', expectedAnswer: 'Yes evidence details' },
      { question: 'Any further details', expectedAnswer: 'Yes cat b details' },
    ])

    categoriserReviewCYAPage.validateExtremismRatingSummary([
      { question: 'Identified at risk of engaging in, or vulnerable to, extremism', expectedAnswer: 'Yes' },
      { question: 'Offences under terrorism legislation', expectedAnswer: 'Yes' },
    ])

    categoriserReviewCYAPage.validateSecurityInputSummary([
      { question: 'Automatic referral to security team', expectedAnswer: 'No' },
      { question: 'Manual referral to security team', expectedAnswer: 'No' },
      { question: 'Flagged by security team', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.validateNextReviewDateSummary([
      { question: 'What date should they be reviewed by?', expectedAnswer: 'Saturday 14 December 2019' },
    ])

    categoriserReviewCYAPage.validateEarliestReleaseDateSummary([
      { question: '5 or more years until earliest release date?', expectedAnswer: 'No' },
      { question: 'Reasons that justify moving to open conditions?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.victimContactSchemeDl().should('exist')

    categoriserReviewCYAPage.validateVictimContactSchemeSummary([
      {
        question: 'Does this prisoner have any victims opted in to the Victim Contact Scheme (VCS)?',
        expectedAnswer: 'No',
      },
    ])

    categoriserReviewCYAPage.validatePreviousSentencesSummary([
      { question: 'Have they been released from a previous sentence in the last 5 years?', expectedAnswer: 'No' },
      { question: 'Was that previous sentence for 7 years or more?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateSexualOffencesSummarySummary([
      { question: 'Have they ever been convicted of a sexual offence?', expectedAnswer: 'No' },
      { question: 'Can the risk to the public be managed in open conditions?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateForeignNationalSummary([
      { question: 'Are they a foreign national?', expectedAnswer: 'No' },
      { question: 'Have the Home Office confirmed their immigration status?', expectedAnswer: 'Not applicable' },
      { question: 'Do they have a liability for deportation?', expectedAnswer: 'Not applicable' },
      { question: 'Have they been through all appeals process in the UK?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateRiskOfHarmSummary([
      { question: 'Risk of serious harm to the public?', expectedAnswer: 'No' },
      { question: 'Can this risk be managed?', expectedAnswer: 'Not applicable' },
    ])

    categoriserReviewCYAPage.validateFurtherChargesOpenSummary([
      { question: 'Are they facing any further charges?', expectedAnswer: 'Yes' },
      { question: 'Further charges details', expectedAnswer: 'some chargesfurtherChargesText details' },
      { question: 'Do these further charges increase risk in open conditions?', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.validateRiskLevelSummary([
      { question: 'Likely to abscond or abuse open conditions?', expectedAnswer: 'No' },
    ])

    categoriserReviewCYAPage.continueButton('Continue').click()

    provisionalCategoryPage.indeterminateWarning().should('not.exist')
    provisionalCategoryPage.warning().contains('The provisional category is open')

    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    provisionalCategoryPage.openConditionsAppropriateYes().click()
    provisionalCategoryPage.submitButton().click()
  })

  it('categoriser overriding to D, supervisor overrides to C', () => {
    provisionalCategoryPage.appropriateNo().click()
    provisionalCategoryPage.overriddenCategoryD().click()
    provisionalCategoryPage.indeterminateWarning().should('not.exist')
    provisionalCategoryPage.setJustificationText('categoriser relevant info 1')

    provisionalCategoryPage.submitButton().click()

    // Open Conditions Added Page
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToTasklistButton(12).click()

    completeOpenConditionsWorkflow(taskListPage)

    taskListPage.openConditionsButton().should('exist')
    taskListPage.continueReviewAndCategorisationButton(12, 'Continue').click()

    categoriserReviewCYAPage.continueButton('Continue').click()

    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    cy.task('stubCategoriseUpdate', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    const provisionalCategoryOpenPage = ProvisionalCategoryOpenPage.createForBookingId(12)
    provisionalCategoryOpenPage.warning().contains('The provisional category is open')
    provisionalCategoryOpenPage.appropriateYes().click()
    provisionalCategoryOpenPage.submitButton().click()

    CategoriserSubmittedPage.createForBookingId(12)
    const categoriserSubmittedPage1 = Page.verifyOnPage(CategoriserSubmittedPage)

    categoriserSubmittedPage1.signOut().click()

    cy.task('stubUncategorisedAwaitingApproval')
    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(12)

    const supervisorReviewPage = Page.verifyOnPage(SupervisorReviewPage)
    cy.task('stubSupervisorApprove')

    supervisorReviewPage.enterOtherInformationText('super other info')
    supervisorReviewPage.selectAgreeWithProvisionalCategoryRadioButton('NO')
    supervisorReviewPage.enterOverriddenCategoryText('super changed D to C')
    supervisorReviewPage.overrideCatC().click()
    supervisorReviewPage.submitButton().click()

    const supervisorReviewOutcomePage = Page.verifyOnPage(SupervisorReviewOutcomePage)
    supervisorReviewOutcomePage.finishButton().click()

    const supervisorHomePage1 = Page.verifyOnPage(SupervisorHomePage)
    cy.task('stubGetStaffDetailsByUsernameList', {
      usernames: [CATEGORISER_USER.username, SUPERVISOR_USER.username],
    })
    cy.task('stubCategorised', { bookingIds: [12] })

    supervisorHomePage1.doneTabLink().click()

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 5 }).click()

    const approvedViewPage = Page.verifyOnPage(ApprovedViewPage)
    approvedViewPage.validateCategorisationWarnings([
      'Category C',
      'The recommended category was changed from Category B to open category',
      'The recommended category was changed from open category to Category C',
    ])
    approvedViewPage.comments().contains('super changed D to C')
    approvedViewPage.comments().contains('super other info')

    approvedViewPage.otherInformationSummary().contains('categoriser relevant info 1')
    approvedViewPage.commentLabel().should('have.length', 1)
  })

  it('The happy path is correct for supervisor overriding to D', () => {
    cy.task('stubCategorise', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    cy.task('stubCategoriseUpdate', {
      bookingId: 12,
      category: 'D',
      committee: 'OCA',
      nextReviewDate: '2019-12-14',
      comment: 'comment',
      placementAgencyId: 'LEI',
      sequenceNumber: 5,
    })

    provisionalCategoryPage.setJustificationText('categoriser relevant info for accept')
    provisionalCategoryPage.appropriateYes().click()
    provisionalCategoryPage.submitButton().click()

    CategoriserSubmittedPage.createForBookingId(12)
    Page.verifyOnPage(CategoriserSubmittedPage)

    provisionalCategoryPage.signOut().click()

    cy.task('stubUncategorisedAwaitingApproval')
    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage2 = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage2.startReviewForPrisoner(12)

    const supervisorReviewPage2 = Page.verifyOnPage(SupervisorReviewPage)
    cy.task('stubSupervisorReject')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [new Date('2019-01-28')],
    })

    supervisorReviewPage2.selectAgreeWithProvisionalCategoryRadioButton('NO')
    supervisorReviewPage2.overrideCatD().click()
    supervisorReviewPage2.enterOverrideReason('super overriding C to D reason text')
    supervisorReviewPage2.enterOtherInformationText('super other info 1')
    supervisorReviewPage2.submitButton().click()
    /*
      supervisorReviewPage1.validateIndeterminateWarningIsDisplayed()
  */

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
    })

    Page.verifyOnPage(SupervisorHomePage)
    supervisorReviewPage2.signOut().click()
    cy.task('stubUncategorised')
    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    const categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(12, 'Edit')

    const taskListPage1 = TaskListPage.createForBookingId(12)
    taskListPage1.supervisorMessageButton().click()

    const supervisorMessagePage = Page.verifyOnPage(SupervisorMessagePage)
    supervisorMessagePage.validateMessages([
      { question: 'Supervisor', expectedAnswer: 'Test User' },
      { question: 'Message', expectedAnswer: 'super overriding C to D reason text' },
    ])
    supervisorMessagePage.saveAndReturnButton().click()

    const taskListPage2 = TaskListPage.createForBookingId(12)
    completeOpenConditionsWorkflow(taskListPage2)

    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'ABC',
    })
    cy.task('stubGetViolenceProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: false,
      displayAssaults: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      band: 4,
    })

    taskListPage2.openConditionsButton().should('exist')
    taskListPage2.continueReviewAndCategorisationButton(12).click()

    const categoriserReviewCYAPage1 = CategoriserReviewCYAPage.createForBookingId(12, 'you continue')
    categoriserReviewCYAPage1.continueButton('Continue').click()

    const provisionalCategoryPage1 = ProvisionalCategoryPage.createForBookingId(12)
    provisionalCategoryPage1.warning().contains('The provisional category is open')
    cy.task('stubCategoriseUpdate', {
      bookingId: 12,
      category: 'D',
      nextReviewDate: '2019-12-14',
      sequenceNumber: 5,
    })
    provisionalCategoryPage1.openConditionsAppropriateYes().click()
    provisionalCategoryPage1.submitButton().click()

    const categoriserSubmittedPage = CategoriserSubmittedPage.createForBookingId(12)
    cy.task('stubUncategorisedAwaitingApproval')
    categoriserSubmittedPage.finishButton().click()

    Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectCompletedPrisonerWithBookingId(12)

    const categoriserAwaitingApprovalViewPage = Page.verifyOnPage(CategoriserAwaitingApprovalViewPage)
    categoriserAwaitingApprovalViewPage.warning().contains('Category for approval is open category')

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    cy.task('stubSupervisorApprove')
    const supHomePage = Page.verifyOnPage(SupervisorHomePage)
    supHomePage.startReviewForPrisoner(12)

    const supervisorReviewPage = Page.verifyOnPage(SupervisorReviewPage)
    supervisorReviewPage.selectAgreeWithProvisionalCategoryRadioButton('YES')
    supervisorReviewPage.submitButton().click()

    const supervisorReviewOutcomePage = Page.verifyOnPage(SupervisorReviewOutcomePage)
    supervisorReviewOutcomePage.finishButton().click()

    const supHomePage1 = Page.verifyOnPage(SupervisorHomePage)
    cy.task('stubCategorised', { bookingIds: [12] })
    cy.task('stubGetStaffDetailsByUsernameList', {
      usernames: [RECATEGORISER_USER.username, SUPERVISOR_USER.username],
    })
    supHomePage1.doneTabLink().click()

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12, sequenceNumber: 5 }).click()

    const approvedViewPage = Page.verifyOnPage(ApprovedViewPage)

    approvedViewPage.validateCategorisationWarnings([
      'Open category',
      'The categoriser recommends open category',
      'The supervisor also recommends open category',
    ])

    approvedViewPage.validatePreviousSupervisorComments({
      expectedComments: 'super overriding C to D reason text',
    })

    approvedViewPage.validateOtherSupervisorComments({
      expectedComments: 'super other info 1',
    })

    approvedViewPage.otherInformationSummary().contains('categoriser relevant info for accept')
    /*
      approvedViewPage.commentLabel().size() == 1
  */
  })

  function setUpStubs() {
    cy.task('stubUncategorised')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
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
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetLifeProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
    })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
  }

  function setUpProfiles() {
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'XER',
    })
    cy.task('stubGetViolenceProfile', {
      offenderNo: 'B2345YZ',
      category: 'C',
      veryHighRiskViolentOffender: true,
      notifySafetyCustodyLead: true,
      displayAssaults: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      band: 1,
    })
  }

  function completeOpenConditionsWorkflow(taskListPage: TaskListPage) {
    taskListPage.openConditionsButton().click()

    const tprsPage = Page.verifyOnPage(TprsPage)
    tprsPage.selectTprsRadioButton('NO')
    tprsPage.continueButton().click()

    const earliestReleasePage = Page.verifyOnPage(EarliestReleaseDatePage)
    earliestReleasePage.selectEarliestReleaseDateRadioButton('NO')
    earliestReleasePage.continueButton().click()

    const previousSentencesPage = Page.verifyOnPage(PreviousSentencesPage)
    previousSentencesPage.selectPreviousSentencesRadioButton('NO')
    previousSentencesPage.continueButton().click()

    const victimContactSchemePage = Page.verifyOnPage(VictimContactSchemePage)
    victimContactSchemePage.selectVictimContactSchemeRadioButton('NO')
    victimContactSchemePage.continueButton().click()

    const sexualOffencesPage = Page.verifyOnPage(SexualOffencesPage)
    sexualOffencesPage.selectSexualOffencesRadioButton('NO')
    sexualOffencesPage.continueButton().click()

    const foreignNationalPage = Page.verifyOnPage(ForeignNationalPage)
    foreignNationalPage.validateInsetText()
    foreignNationalPage.selectForeignNationalRadioButton('NO')
    foreignNationalPage.continueButton().click()

    const riskOfSeriousHarmPage = Page.verifyOnPage(RiskOfSeriousHarmPage)
    riskOfSeriousHarmPage.selectRiskOfSeriousHarmRadioButton('NO')
    riskOfSeriousHarmPage.continueButton().click()

    const furtherChargesPage = Page.verifyOnPage(FurtherChargesPage)
    furtherChargesPage.setFurtherChargesCategoryBAppropriateText('furtherChargesText details')
    furtherChargesPage.selectIncreasedRiskRadioButton('NO')
    furtherChargesPage.continue().click()

    const riskLevelsPage = Page.verifyOnPage(RiskLevelsPage)
    riskLevelsPage.selectRiskLevelsRadioButton('NO')
    riskLevelsPage.continueButton().click()
  }
})
