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

    higherSecurityReviewPage.behaviourSuggestingHigherCategoryReviewInput().type('Some behaviour text')
    higherSecurityReviewPage.stepsTakenToManageBehaviourInput().type('Some steps text')
    higherSecurityReviewPage.reasonWhyInput().type('Some reason text')
    higherSecurityReviewPage.whatConditionsAreNecessary().type('Some conditions text')
    higherSecurityReviewPage.submitButton().click()

    tasklistRecatPage.categoryDecisionLink().parent().parent().contains('Completed')
    tasklistRecatPage.categoryDecisionLink().click()
    decisionPage.submitButton().click()
    higherSecurityReviewPage.behaviourSuggestingHigherCategoryReviewInput().should('have.value', 'Some behaviour text')
    higherSecurityReviewPage.stepsTakenToManageBehaviourInput().should('have.value', 'Some steps text')
    higherSecurityReviewPage.reasonWhyInput().should('have.value', 'Some reason text')
    higherSecurityReviewPage.whatConditionsAreNecessary().should('have.value', 'Some conditions text')
  })
})
