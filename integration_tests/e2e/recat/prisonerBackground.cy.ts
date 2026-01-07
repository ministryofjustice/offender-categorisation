import { RECATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import PrisonerBackgroundPage from '../../pages/form/recat/decision/prisonerBackgroundPage'

describe('Prisoner background page', () => {
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
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'XEL',
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

  it('Navigates to the prisoner background page, testing the validation, links and entering data correctly', () => {
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(12, 'Start', 'DUE')
    const tasklistRecatPage = Page.verifyOnPage(TasklistRecatPage)
    tasklistRecatPage.prisonerBackgroundLink().click()

    const prisonerBackgroundPage = Page.verifyOnPage(PrisonerBackgroundPage)
    prisonerBackgroundPage.submitButton().click()
    prisonerBackgroundPage.errorSummaries().contains('Please enter details')
    prisonerBackgroundPage.errors().contains('Please enter details')

    prisonerBackgroundPage.previousCategoryReviewsLink().invoke('removeAttr', 'target').click()
    cy.contains('Check previous category reviews')
    cy.go('back')

    prisonerBackgroundPage.offenceDetailsInput().type('Test offence details')
    prisonerBackgroundPage.submitButton().click()

    tasklistRecatPage.prisonerBackgroundLink().click()
    prisonerBackgroundPage.offenceDetailsInput().should('have.value', 'Test offence details')
  })
})
