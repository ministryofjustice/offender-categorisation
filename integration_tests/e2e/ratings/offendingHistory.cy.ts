import moment from 'moment/moment'
import { CATEGORISER_USER } from '../../factory/user'
import TaskListPage from '../../pages/taskList/taskList'
import CategoriserOffendingHistoryPage from '../../pages/form/ratings/offendingHistory'
import Status from '../../../server/utils/statusEnum'
import { FormDbJson } from '../../fixtures/db-key-convertor'

describe('Offending History', () => {
  let taskListPage: TaskListPage
  let categoriserOffendingHistoryPage: CategoriserOffendingHistoryPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    cy.task('stubUncategorised')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [
        moment().subtract(4, 'days').format('yyyy-MM-dd'),
        moment().subtract(1, 'days').format('yyyy-MM-dd'),
      ],
    })
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

    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
  })

  /**
   * Extracted to a separate step as some of the stubbing needs to differ between tests before
   * this point is reached.
   */
  const stubLoginAndBrowseToOffendingHistoryPage = () => {
    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    cy.get('a[href*="/tasklist/12"]').click()

    taskListPage = TaskListPage.createForBookingId(12)
    taskListPage.offendingHistoryLink().click()

    categoriserOffendingHistoryPage = CategoriserOffendingHistoryPage.createForBookingId(12)
  }

  describe('The Offending history page is shown correctly', () => {
    it('should display for a previous Cat A', () => {
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })

      stubLoginAndBrowseToOffendingHistoryPage()

      categoriserOffendingHistoryPage.validateExpectedCatAWarning(
        'This prisoner was categorised as Cat A in 2012 until 2013 for a previous sentence and released as a Cat B in 2014',
      )
      categoriserOffendingHistoryPage.validateCatAInfoExists({ exists: false })
      categoriserOffendingHistoryPage.validateExpectedConvictions([
        'Libel (21/02/2019)',
        'Slander (22/02/2019 - 24/02/2019)',
        'Undated offence',
      ])
    })

    it('should display when not a previous Cat A', () => {
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ', emptyResponse: true })

      stubLoginAndBrowseToOffendingHistoryPage()

      categoriserOffendingHistoryPage.validateExpectedCatAInfo(
        'This person has not been categorised as Cat A, restricted or a provisional Cat A before.',
      )
      categoriserOffendingHistoryPage.validateCatAWarningExists({ exists: false })
    })

    it('should display when Cat A in current booking', () => {
      cy.task('stubAssessmentsWithCurrent', { offenderNumber: 'B2345YZ' })

      stubLoginAndBrowseToOffendingHistoryPage()

      categoriserOffendingHistoryPage.validateExpectedCatAWarning(
        'This prisoner was categorised as Provisional Cat A in 2018 until 2019',
      )
      categoriserOffendingHistoryPage.validateCatAInfoExists({ exists: false })
    })
  })

  describe('form submission', () => {
    beforeEach(() => {
      cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })

      stubLoginAndBrowseToOffendingHistoryPage()

      categoriserOffendingHistoryPage.validatePreviousConvictionRadioButtons({
        selection: ['NO', 'YES'],
        isChecked: false,
      })
      categoriserOffendingHistoryPage.validatePreviousConvictionsTextBox({ isVisible: false })
    })

    it('should show a validation error on empty form submission', () => {
      categoriserOffendingHistoryPage.saveAndReturnButton().click()

      categoriserOffendingHistoryPage.errorSummaries().contains('Please select yes or no')
      categoriserOffendingHistoryPage.errors().contains('Please select yes or no')
    })

    describe('should record a valid form submission', () => {
      it('should accept no previous convictions', () => {
        categoriserOffendingHistoryPage.selectPreviousConvictionsRadioButton('NO')
        categoriserOffendingHistoryPage.validatePreviousConvictionsTextBox({ isVisible: false })
        categoriserOffendingHistoryPage.saveAndReturnButton().click()

        taskListPage.offendingHistoryLink().click()

        categoriserOffendingHistoryPage.validatePreviousConvictionRadioButtons({
          selection: ['YES'],
          isChecked: false,
        })

        categoriserOffendingHistoryPage.validatePreviousConvictionRadioButtons({
          selection: ['NO'],
          isChecked: true,
        })

        cy.task('selectFormTableDbRow', { bookingId: 12 }).then((result: { rows: FormDbJson[] }) =>
          expect(result.rows[0].status).to.eq(Status.STARTED.name),
        )
      })

      it('should record previous convictions and the reasoning', () => {
        categoriserOffendingHistoryPage.selectPreviousConvictionsRadioButton('YES')
        categoriserOffendingHistoryPage.validatePreviousConvictionsTextBox({ isVisible: true, expectedText: '' })
        categoriserOffendingHistoryPage.setPreviousConvictionsText('some convictions details')
        categoriserOffendingHistoryPage.saveAndReturnButton().click()

        taskListPage.offendingHistoryLink().click()

        categoriserOffendingHistoryPage.validatePreviousConvictionRadioButtons({
          selection: ['NO'],
          isChecked: false,
        })

        categoriserOffendingHistoryPage.validatePreviousConvictionRadioButtons({
          selection: ['YES'],
          isChecked: true,
        })

        cy.task('selectFormTableDbRow', { bookingId: 12 }).then((result: { rows: FormDbJson[] }) =>
          expect(result.rows[0].status).to.eq(Status.STARTED.name),
        )
      })
    })
  })
})
