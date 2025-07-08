import moment from 'moment'
import { CATEGORISER_USER, FEMALE_USER, UserAccount } from '../../factory/user'
import Page from '../../pages/page'
import CategoriserHomePage from '../../pages/categoriser/home'
import TaskListPage from '../../pages/taskList/taskList'
import EscapePage from '../../pages/form/ratings/escape'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'

describe('Escape Risk', () => {
  let categoriserHomePage: CategoriserHomePage
  let escapePage: EscapePage
  let taskListPage: TaskListPage
  let bookingId: number

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    bookingId = 12

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
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
  })

  /**
   * Extracted to a separate step as some of the stubbing needs to differ between tests before
   * this point is reached.
   */
  const stubLoginAndBrowseToEscapePage = ({ user }: { user: UserAccount } = { user: CATEGORISER_USER }) => {
    cy.stubLogin({
      user,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.escapeButton().click()
  }

  it('should display an alert and extra question when the offender is on the escape list', () => {
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'XEL',
    })

    stubLoginAndBrowseToEscapePage()

    escapePage = EscapePage.createForBookingId(bookingId)

    escapePage.validateWarningText('This person is considered an escape risk')

    escapePage.validateInfoVisibility({ isVisible: false })

    escapePage.validateFormTextContains('Do you think this information means they should be in Cat B?')
  })

  it('should display an info message when the offender is not on the escape list', () => {
    cy.task('stubGetEscapeProfile', {
      offenderNo: 'B2345YZ',
      alertCode: 'ABC',
    })

    stubLoginAndBrowseToEscapePage()

    escapePage = EscapePage.createForBookingId(bookingId)

    escapePage.validateInfoVisibility({ isVisible: true })
    escapePage.validateInfoText('This person is not on the E-List and does not have an escape risk alert.')

    escapePage.validateWarningVisibility({ isVisible: false })
  })

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345YZ',
        alertCode: 'XEL',
      })

      stubLoginAndBrowseToEscapePage()

      escapePage = EscapePage.createForBookingId(bookingId)
      escapePage.saveAndReturnButton().click()

      escapePage.validateErrorSummaryMessages([
        { index: 0, href: '#escapeCatB', text: 'Please select yes or no' },
        { index: 1, href: '#escapeOtherEvidence', text: 'Please select yes or no' },
      ])

      escapePage.validateErrorMessages([
        { selector: '#escapeCatB-error', text: 'Please select yes or no' },
        { selector: '#escapeOtherEvidence-error', text: 'Please select yes or no' },
      ])
    })

    it(`should handle validation when prisoner is not on the escape list`, () => {
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345YZ',
        alertCode: 'ABC',
      })

      stubLoginAndBrowseToEscapePage()

      escapePage = EscapePage.createForBookingId(bookingId)
      escapePage.validCategoryBQuestionVisibility({ isVisible: false })
      escapePage.selectOtherEvidenceBRadioButton('YES')
      escapePage.saveAndReturnButton().click()

      escapePage.validateErrorSummaryMessages([
        { index: 0, href: '#escapeOtherEvidenceText', text: 'Please enter details of escape risk evidence' },
      ])

      escapePage.validateErrorMessages([{ selector: '#escapeOtherEvidenceText-error', text: 'Please provide details' }])
    })

    it(`should handle validation when prisoner is on the escape list`, () => {
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345YZ',
        alertCode: 'XER',
      })

      stubLoginAndBrowseToEscapePage()

      escapePage = EscapePage.createForBookingId(bookingId)
      escapePage.selectShouldBeInCategoryBRadioButton('YES')
      escapePage.selectOtherEvidenceBRadioButton('YES')
      escapePage.saveAndReturnButton().click()

      escapePage.validateErrorSummaryMessages([
        { index: 0, href: '#escapeCatBText', text: 'Please enter details explaining cat B' },
        { index: 1, href: '#escapeOtherEvidenceText', text: 'Please enter details of escape risk evidence' },
      ])

      escapePage.validateErrorMessages([
        { selector: '#escapeCatBText-error', text: 'Please enter details explaining your answer' },
        { selector: '#escapeOtherEvidenceText-error', text: 'Please provide details' },
      ])
    })

    it('should record a valid form submission', () => {
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'B2345YZ',
        alertCode: 'XEL',
      })

      stubLoginAndBrowseToEscapePage()

      escapePage = EscapePage.createForBookingId(bookingId)

      escapePage.selectShouldBeInCategoryBRadioButton('YES')
      escapePage.selectOtherEvidenceBRadioButton('NO')
      escapePage.setCatBText('escape cat b explanation')
      escapePage.saveAndReturnButton().click()

      taskListPage.escapeButton().click()

      escapePage.validateShouldBeInCategoryBRadioButton({
        selection: ['YES'],
        isChecked: true,
      })

      escapePage.validateShouldBeInCategoryBTextAreaContent('escape cat b explanation')

      escapePage.validateOtherEvidenceBRadioButton({
        selection: ['NO'],
        isChecked: true,
      })

      escapePage.saveAndReturnButton().click()

      cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
        expect(result.rows[0].status).to.eq(Status.STARTED.name)
        expect(result.rows[0].form_response).to.deep.eq({
          ratings: {
            escapeRating: {
              escapeCatB: 'Yes',
              escapeCatBText: 'escape cat b explanation',
              escapeOtherEvidence: 'No',
            },
          },
        })
      })
    })
  })

  describe("Women's estate", () => {
    it('should not display the Category B question', () => {
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
        category: 'U(Unsentenced)',
        increasedRisk: false,
        notifyRegionalCTLead: false,
      })
      cy.task('stubAssessmentsWomen', { offenderNo: 'ON700' })
      cy.task('stubSentenceDataGetSingle', { offenderNumber: 'ON700', formattedReleaseDate: '2014-11-23' })
      cy.task('stubGetEscapeProfile', {
        offenderNo: 'ON700',
        alertCode: 'XEL',
      })

      stubLoginAndBrowseToEscapePage({
        user: FEMALE_USER,
      })

      escapePage = EscapePage.createForBookingId(bookingId)

      escapePage.validateWarningText('This person is considered an escape risk')

      escapePage.validateInfoVisibility({ isVisible: false })

      escapePage.validCategoryBQuestionVisibility({ isVisible: false })
    })
  })
})
