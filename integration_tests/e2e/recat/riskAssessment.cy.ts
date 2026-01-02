import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import RiskAssessmentPage from '../../pages/form/recat/decision/riskAssessmentPage'

describe('Risk assessment page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    const today = new Date()

    cy.task('stubRecategorise')
    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345YZ'],
      bookingIds: [12],
      startDates: [today],
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

  it('Navigates to the risk assessment page, testing the validation, entering and saving data correctly', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(12, 'Start', 'DUE')
    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.riskAssessmentLink().click()

    const riskAssessmentPage = Page.verifyOnPage(RiskAssessmentPage)
    riskAssessmentPage.submitButton().click()
    riskAssessmentPage.errorSummaries().contains('Please enter lower security category details')
    riskAssessmentPage.lowerCategoryInput().parent().contains('Please enter details')
    riskAssessmentPage.errorSummaries().contains('Please enter higher security category details')
    riskAssessmentPage.higherCategoryInput().parent().contains('Please enter details')
    riskAssessmentPage.errorSummaries().contains('Please select yes or no')
    riskAssessmentPage.errors().contains('Please select yes or no')

    riskAssessmentPage.otherRelevantInformationYes().click()
    riskAssessmentPage.submitButton().click()
    riskAssessmentPage.errorSummaries().contains('Please enter other relevant information')
    riskAssessmentPage.otherRelevantTextInput().parent().contains('Please enter details')

    riskAssessmentPage.lowerCategoryInput().type('test lower category details')
    riskAssessmentPage.higherCategoryInput().type('test higher category details')
    riskAssessmentPage.otherRelevantTextInput().type('test other relevant information')

    riskAssessmentPage.submitButton().click()
    tasklistRecatPage.riskAssessmentLink().click()
    riskAssessmentPage.lowerCategoryInput().should('have.value', 'test lower category details')
    riskAssessmentPage.higherCategoryInput().should('have.value', 'test higher category details')
    riskAssessmentPage.otherRelevantInformationYes().should('be.checked')
    riskAssessmentPage.otherRelevantTextInput().should('have.value', 'test other relevant information')
  })
})
