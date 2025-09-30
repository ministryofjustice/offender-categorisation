import moment from 'moment'
import { FEMALE_USER } from '../../factory/user'
import CategoriserHomePage from '../../pages/categoriser/home'
import Page from '../../pages/page'
import TaskListPage from '../../pages/taskList/taskList'
import CategoryDecisionPage from '../../pages/form/ratings/categoryDecision'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import OpenConditionsAdded from '../../pages/openConditionsAdded'

describe('Category Decision', () => {
  let categoryDecisionPage: CategoryDecisionPage
  let categoriserHomePage: CategoriserHomePage
  let taskListPage: TaskListPage
  let bookingId: number

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  describe('Female Adult Decision Page', () => {
    beforeEach(() => {
      bookingId = 700

      cy.task('stubUncategorisedNoStatus', { bookingId, location: 'PFI' })
      cy.task('stubSentenceData', {
        offenderNumbers: ['ON700'],
        bookingIds: [bookingId],
        startDates: [moment().subtract(3, 'days')],
      })

      cy.task('stubGetOffenderDetailsWomen', { bookingId, category: 'ON700' })
      cy.task('stubGetSocProfile', {
        offenderNo: 'ON700',
        category: 'U(Unsentenced)',
        transferToSecurity: false,
      })
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'ON700',
        band: 4,
      })

      cy.stubLogin({
        user: FEMALE_USER,
      })
      cy.signIn()

      categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId)

      taskListPage = TaskListPage.createForBookingId(bookingId)
      taskListPage.categoryDecisionLink().click()

      categoryDecisionPage = CategoryDecisionPage.createForBookingId(bookingId)
    })

    describe('form submission', () => {
      it('should show a validation error on empty form submission', () => {
        categoryDecisionPage.continueButton().click()

        categoryDecisionPage.errorSummaries().contains('Select the category that is most suitable for this prisoner')
        categoryDecisionPage.errors().contains('Select the category that is most suitable for this prisoner')
        categoryDecisionPage
          .errorSummaries()
          .contains('You must enter information about why the category is appropriate')
        categoryDecisionPage.errors().contains('You must enter information about why the category is appropriate')
      })

      describe('should record a valid form submission', () => {
        it(`should accept a 'Closed' category decision`, () => {
          categoryDecisionPage.selectCategoryDecisionRadioButton('CLOSED')
          categoryDecisionPage.enterCategoryDecisionJustification('Test justification')
          categoryDecisionPage.continueButton().click()

          taskListPage.checkOnPage()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: { decision: { category: 'R', justification: 'Test justification' } },
              openConditionsRequested: false,
            })
          })
        })

        it(`should accept an 'Open' category decision`, () => {
          categoryDecisionPage.selectCategoryDecisionRadioButton('OPEN')
          categoryDecisionPage.enterCategoryDecisionJustification('Test justification')
          categoryDecisionPage.continueButton().click()

          const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
          openConditionsAddedPage.returnToTasklistButton(bookingId).click()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            cy.log(result.rows[0].form_response)

            expect(result.rows[0].form_response).to.deep.eq({
              ratings: { decision: { category: 'T', justification: 'Test justification' } },
              openConditionsRequested: true,
            })
          })
        })
      })
    })
  })

  describe('Female YOI Decision Page', () => {
    beforeEach(() => {
      bookingId = 21

      cy.task('stubUncategorisedForWomenYOI', { bookingId, location: 'PFI' })
      cy.task('stubGetPrisonerSearchPrisonersWomen')
      cy.task('stubSentenceData', {
        offenderNumbers: ['C0001AA'],
        bookingIds: [bookingId],
        startDates: [moment().subtract(3, 'days')],
      })

      cy.task('stubGetOffenderDetailsWomenYOI', {
        bookingId,
        offenderNo: 'C0001AA',
        category: 'U(Unsentenced)',
        youngOffender: true,
      })
      cy.task('stubGetSocProfile', {
        offenderNo: 'C0001AA',
        category: 'U(Unsentenced)',
        transferToSecurity: false,
      })
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'C0001AA',
        band: 4,
      })

      cy.stubLogin({
        user: FEMALE_USER,
      })
      cy.signIn()

      categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId)

      taskListPage = TaskListPage.createForBookingId(bookingId)
      taskListPage.categoryDecisionLink().click()

      categoryDecisionPage = CategoryDecisionPage.createForBookingId(bookingId)
    })

    describe('form submission', () => {
      it('should show a validation error on empty form submission', () => {
        categoryDecisionPage.continueButton().click()

        categoryDecisionPage.errorSummaries().contains('Select the category that is most suitable for this prisoner')
        categoryDecisionPage.errors().contains('Select the category that is most suitable for this prisoner')
        categoryDecisionPage
          .errorSummaries()
          .contains('You must enter information about why the category is appropriate--')
        categoryDecisionPage.errors().contains('You must enter information about why the category is appropriate')
      })

      describe('should record a valid form submission', () => {
        it(`should accept a 'YOI Closed' category decision`, () => {
          categoryDecisionPage.selectYOICategoryDecisionRadioButton('YOI_CLOSED')
          categoryDecisionPage.enterCategoryDecisionJustification('Test justification')
          categoryDecisionPage.continueButton().click()

          taskListPage.checkOnPage()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: { decision: { category: 'I', justification: 'Test justification' } },
              openConditionsRequested: false,
            })
          })
        })

        it(`should accept a 'Consider for YOI Open' category decision`, () => {
          categoryDecisionPage.selectYOICategoryDecisionRadioButton('CONSIDER_FOR_OPEN')
          categoryDecisionPage.enterCategoryDecisionJustification('Test justification')
          categoryDecisionPage.continueButton().click()

          const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
          openConditionsAddedPage.returnToTasklistButton(bookingId).click()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: { decision: { category: 'J', justification: 'Test justification' } },
              openConditionsRequested: true,
            })
          })
        })

        it(`should accept a 'Closed' category decision`, () => {
          categoryDecisionPage.selectYOICategoryDecisionRadioButton('CLOSED')
          categoryDecisionPage.enterCategoryDecisionJustification('Test justification')
          categoryDecisionPage.continueButton().click()

          taskListPage.checkOnPage()

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: { decision: { category: 'R', justification: 'Test justification' } },
              openConditionsRequested: false,
            })
          })
        })
      })
    })
  })
})
