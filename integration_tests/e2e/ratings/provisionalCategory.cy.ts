import moment from 'moment'
import { CATEGORISER_USER } from "../../factory/user"
import CategoriserHomePage from '../../pages/categoriser/home'
import Page from '../../pages/page'
import TaskListPage from '../../pages/taskList/taskList'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import ProvisionalCategoryPage from "../../pages/form/categoriser/provisionalCategory"
import { CATEGORISATION_TYPE } from "../../support/categorisationType"
import { AGENCY_LOCATION } from "../../factory/agencyLocation"
import STATUS from '../../../server/utils/statusEnum'
import CategoriserReviewCYAPage from "../../pages/form/categoriser/review";

describe('Provisional Category', () => {
  let provisionalCategoryPage: ProvisionalCategoryPage
  let categoriserHomePage: CategoriserHomePage
  let taskListPage: TaskListPage
  const bookingId = 12

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  describe('Adult Provisional Category Page', () => {
    beforeEach(() => {
      cy.task('stubUncategorised')
      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [11, bookingId],
        startDates: [
          moment().subtract(4, 'days').format('yyyy-MM-dd'),
          moment().subtract(1, 'days').format('yyyy-MM-dd'),
        ],
      })
      cy.task('stubGetOffenderDetails', {
        bookingId,
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
        previousOffences: true,
      })
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'B2345YZ',
        category: 'C',
        increasedRisk: true,
        notifyRegionalCTLead: false,
      })
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
      cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
      cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345YZ',
        category: 'C',
        onEscapeList: true,
        activeOnEscapeList: false,
      })
      cy.task('stubGetViolenceProfile', {
        offenderNo: 'B2345YZ',
        category: 'C',
        veryHighRiskViolentOffender: false,
        notifySafetyCustodyLead: false,
        displayAssaults: false,
      })
      cy.task('stubGetLifeProfile', {
        offenderNo: 'B2345YZ',
        category: 'C',
      })

      cy.task('insertFormTableDbRow', {
        id: -2,
        bookingId: bookingId,
        nomisSequenceNumber: 1,
        catType: CATEGORISATION_TYPE.INITIAL,
        offenderNo: 'B2345YZ',
        sequenceNumber: 1,
        status: STATUS.STARTED.name,
        prisonId: AGENCY_LOCATION.LEI.id,
        startDate: new Date(),
        formResponse: {
          ratings: {
            escapeRating: {
              escapeOtherEvidence: 'No',
            },
            furtherCharges: {
              furtherCharges: 'Yes',
              furtherChargesText: 'some charges',
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
        },
        securityReviewedBy: null,
        securityReviewedDate: null,
        assignedUserId: null,
        approvedBy: null,
        review_reason: 'AGE',
        approvalDate: null,
      })

      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()

      categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
      categoriserHomePage.selectPrisonerWithBookingId(bookingId, 'Edit')

      taskListPage = TaskListPage.createForBookingId(bookingId)
      taskListPage.continueReviewAndCategorisationButton(bookingId).click()
      const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(bookingId, 'continue')
      categoriserReviewCYAPage.continueButton('Continue').click()
      provisionalCategoryPage = ProvisionalCategoryPage.createForBookingId(bookingId)
    })

    describe('form submission', () => {
      it('should show a validation error on empty form submission', () => {
        provisionalCategoryPage.submitButton().click()

        provisionalCategoryPage.errorSummaries().contains('Select yes if you think this category is appropriate')
        provisionalCategoryPage.errors().contains('Select yes if you think this category is appropriate')
        provisionalCategoryPage.errorSummaries().contains('You must enter information about why the category is appropriate')
        provisionalCategoryPage.errors().contains('You must enter information about why the category is appropriate')
      })

      it(`should accept an agreement with the suggested category`, () => {
        provisionalCategoryPage.selectCategoryAppropriateRadioButton('YES')
        provisionalCategoryPage.setOtherInformationText('Test justification')

        cy.task('stubCategoriseUpdate', {
          bookingId: 12,
          category: 'B',
          nextReviewDate: '2019-12-14',
          sequenceNumber: 2,
        })

        provisionalCategoryPage.submitButton().click()
        cy.get('h1').contains('Submitted for approval')

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          console.log(result.rows[0].form_response)
          expect(result.rows[0].form_response.categoriser.provisionalCategory).to.deep.eq({
            "suggestedCategory": "B",
            "categoryAppropriate": "Yes",
            "otherInformationText": "Test justification"
          })
        })
      })

      it(`should show error when the user disagrees with the suggested category but doesn't choose another`, () => {
        provisionalCategoryPage.selectCategoryAppropriateRadioButton('NO')
        provisionalCategoryPage.setOtherInformationText('Test justification')

        provisionalCategoryPage.submitButton().click()

        provisionalCategoryPage.errorSummaries().contains('Please enter the new category')
        provisionalCategoryPage.errors().contains('Please enter the new category')
      })

      it(`should accept a disagreement with the suggested category and change to C`, () => {
        provisionalCategoryPage.selectCategoryAppropriateRadioButton('NO')
        provisionalCategoryPage.selectOverrideCategoryDecisionRadioButton('C')
        provisionalCategoryPage.setOtherInformationText('Test justification')

        cy.task('stubCategoriseUpdate', {
          bookingId: 12,
          category: 'C',
          nextReviewDate: '2019-12-14',
          sequenceNumber: 2,
        })

        provisionalCategoryPage.submitButton().click()
        cy.get('h1').contains('Submitted for approval')

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          console.log(result.rows[0].form_response)
          expect(result.rows[0].form_response.categoriser.provisionalCategory).to.deep.eq({
            "suggestedCategory": "B",
            "overriddenCategory": "C",
            "categoryAppropriate": "No",
            "otherInformationText": "Test justification"
          })
        })
      })

      it(`should accept a disagreement with the suggested category and change to D`, () => {
        provisionalCategoryPage.selectCategoryAppropriateRadioButton('NO')
        provisionalCategoryPage.selectOverrideCategoryDecisionRadioButton('D')
        provisionalCategoryPage.setOtherInformationText('Test justification')

        provisionalCategoryPage.submitButton().click()
        cy.get('h1').contains('Open conditions assessment added to your task list')
        cy.get(`a[href*="/tasklist/${bookingId}"]`).click()
        taskListPage.openConditionsButton().should('exist')

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          console.log(result.rows[0].form_response)
          expect(result.rows[0].form_response.categoriser.provisionalCategory).to.deep.eq({
            "suggestedCategory": "B",
            "overriddenCategory": "D",
            "categoryAppropriate": "No",
            "otherInformationText": "Test justification"
          })
        })
      })
    })
  })
})
