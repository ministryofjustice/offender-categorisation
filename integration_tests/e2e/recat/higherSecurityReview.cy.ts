import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import DecisionPage from '../../pages/form/recat/decision/decisionPage'
import HigherSecurityReviewPage from '../../pages/form/recat/decision/higherSecurityReviewPage'

describe('Higher security review', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    const today = new Date()

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
    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345YZ',
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
    cy.task('stubGetViperData', {
      prisonerNumber: 'B2345YZ',
      aboveThreshold: true,
    })
    cy.task('stubGetAssaultIncidents', {
      prisonerNumber: 'B2345YZ',
      assaultIncidents: [],
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()
  })

  it('Navigating to the higher security review page and submitting without enter data shows validation errors', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(12, 'Start', 'DUE')
    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.categoryDecisionLink().click()

    const decisionPage = Page.verifyOnPage(DecisionPage)
    decisionPage.catBOption().click()
    decisionPage.enterCategoryDecisionJustification('category justification text')
    decisionPage.submitButton().click()

    const higherSecurityReviewPage = Page.verifyOnPage(HigherSecurityReviewPage)
    higherSecurityReviewPage.submitButton().click()
    higherSecurityReviewPage.errorSummaries().contains('Please enter behaviour details')
    higherSecurityReviewPage.errorSummaries().contains('Please enter steps details')
    higherSecurityReviewPage.errorSummaries().contains('Please select yes or no')
    higherSecurityReviewPage.errorSummaries().contains('Please enter security conditions details')
    higherSecurityReviewPage.behaviourSuggestingHigherCategoryReviewInput().parent().contains('Please enter details')
    higherSecurityReviewPage.stepsTakenToManageBehaviourInput().parent().contains('Please enter details')
    higherSecurityReviewPage.errors().contains('Please select yes or no')
    higherSecurityReviewPage.whatConditionsAreNecessary().parent().contains('Please enter details')

    higherSecurityReviewPage.answerNoToCouldBehaviourBeManagedInAnotherPrison().click()
    higherSecurityReviewPage.submitButton().click()
    higherSecurityReviewPage.errorSummaries().contains('Please enter transfer details')
    higherSecurityReviewPage.reasonWhyInput().parent().contains('Please enter details')
  })
})
