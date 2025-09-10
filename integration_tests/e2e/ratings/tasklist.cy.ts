import CategoriserHomePage from '../../pages/categoriser/home'
import FurtherChargesPage from '../../pages/form/ratings/furtherCharges'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment'
import { CATEGORISER_USER, FEMALE_USER } from '../../factory/user'
import Page from '../../pages/page'
import { CASELOAD } from '../../factory/caseload'
import CategoriserOffendingHistoryPage from '../../pages/form/ratings/offendingHistory'
import ViolencePage from '../../pages/form/ratings/violence'
import EscapePage from '../../pages/form/ratings/escape'
import ExtremismPage from '../../pages/form/ratings/extremism'
import CategoriserSecurityInputPage from '../../pages/form/ratings/categoriserSecurityInputPage'
import NextReviewQuestionPage from '../../pages/form/ratings/nextReviewQuestionPage'
import NextReviewConfirmationPage from '../../pages/form/ratings/nextReviewConfirmationPage'
import CategoriserReviewCYAPage from '../../pages/form/categoriser/review'

describe('Tasklist', () => {
  let categoriserHomePage: CategoriserHomePage
  let taskListPage: TaskListPage
  const bookingId = 12
  const offenderNumber = 'B2345YZ'

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    cy.task('stubUncategorised')
    cy.task('stubSentenceData', {
      offenderNumbers: [offenderNumber],
      bookingIds: [12],
      startDates: [moment().subtract(1, 'days').format('yyyy-MM-dd')],
    })
    cy.task('stubGetOffenderDetails', {
      bookingId,
      offenderNo: offenderNumber,
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubGetSocProfile', {
      offenderNo: offenderNumber,
      category: 'C',
      transferToSecurity: false,
    })

    cy.task('stubAssessments', { offenderNumber: offenderNumber })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: offenderNumber, formattedReleaseDate: '2014-11-23' })

    cy.task('stubGetExtremismProfile', {
      offenderNo: offenderNumber,
      band: 4,
    })
  })

  it('should show correct male tasklist even when user has active caseload ID of womens estate prison', () => {
    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId)

    cy.task('stubUncategorisedNoStatus', { bookingId, location: CASELOAD.PFI.id })
    cy.stubLogin({
      user: FEMALE_USER,
    })
    cy.signIn()
    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)

    cy.visit(`/tasklist/12`)
    taskListPage = TaskListPage.createForBookingId(bookingId)

    cy.task('stubOffenceHistory', { offenderNumber: offenderNumber })
    taskListPage.offendingHistoryLink().click()

    const categoriserOffendingHistoryPage = CategoriserOffendingHistoryPage.createForBookingId(bookingId)
    categoriserOffendingHistoryPage.selectPreviousConvictionsRadioButton('NO')
    categoriserOffendingHistoryPage.saveAndReturnButton().click()

    taskListPage.furtherChargesLink().click()

    const furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
    furtherChargesPage.selectFurtherChargesRadioButton('NO')
    furtherChargesPage.saveAndReturnButton().click()

    cy.task('stubGetViolenceProfile', {
      offenderNo: offenderNumber,
      category: 'C',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: false,
      displayAssaults: false,
    })
    cy.task('stubGetSocProfile', {
      offenderNo: offenderNumber,
      transferToSecurity: false,
      category: 'C',
    })

    taskListPage.violenceLink().click()

    const violencePage = ViolencePage.createForBookingId(bookingId)
    violencePage.validateViolenceWarningExists({ exists: false })
    violencePage.selectHighRiskOfViolenceRadioButton('NO')
    violencePage.selectSeriousThreadRadioButton('NO')
    violencePage.saveAndReturnButton().click()

    cy.task('stubGetEscapeProfile', {
      offenderNo: offenderNumber,
      alertCode: 'XER',
    })
    taskListPage.escapeLink().click()

    const escapePage = EscapePage.createForBookingId(bookingId)
    escapePage.selectShouldBeInCategoryBRadioButton('NO')
    escapePage.selectOtherEvidenceBRadioButton('NO')
    escapePage.saveAndReturnButton().click()

    cy.task('stubGetExtremismProfile', {
      offenderNo: offenderNumber,
      band: 4,
    })
    taskListPage.extremismLink().click()

    const extremismPage = ExtremismPage.createForBookingId(bookingId)
    extremismPage.selectPreviousTerrorismOffencesRadioButton('NO')
    extremismPage.saveAndReturnButton().click()

    taskListPage.securityLink().click()

    const categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
    categoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
    categoriserOffendingHistoryPage.saveAndReturnButton().click()

    taskListPage.nextReviewDateLink().click()

    const nextReviewQuestionPage = NextReviewQuestionPage.createForBookingId(bookingId)
    nextReviewQuestionPage.selectNextReviewRadioButton('IN_SIX_MONTHS')
    nextReviewQuestionPage.continueButton().click()

    const nextReviewConfirmationPage = NextReviewConfirmationPage.createForBookingIdAndChoiceNumber(bookingId, '6')
    nextReviewConfirmationPage.saveAndReturnButton().click()

    cy.task('stubGetLifeProfile', {
      offenderNo: offenderNumber,
      category: 'C',
    })
    taskListPage.checkAndSubmitCategorisationLink(bookingId).click()

    const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(bookingId, 'you continue')
    categoriserReviewCYAPage.continueButton('Continue').click()

    cy.get('.govuk-warning-text:eq(0)').should(
      'contain.text',
      'Based on the information provided, the provisional category is Category B',
    )
  })
})
