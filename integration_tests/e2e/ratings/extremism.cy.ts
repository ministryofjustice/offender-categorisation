import CategoriserHomePage from '../../pages/categoriser/home'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment/moment'
import { CATEGORISER_USER, UserAccount } from '../../factory/user'
import Page from '../../pages/page'
import ExtremismPage from '../../pages/form/ratings/extremism'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'

describe('Extremism', () => {
  let categoriserHomePage: CategoriserHomePage
  let extremismPage: ExtremismPage
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
  })

  /**
   * Extracted to a separate step as some of the stubbing needs to differ between tests before
   * this point is reached.
   */
  const stubLoginAndBrowseToExtremismPage = ({ user }: { user: UserAccount } = { user: CATEGORISER_USER }) => {
    cy.stubLogin({
      user,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.extremismLink().click()
  }

  describe('increased risk variations', () => {
    it('should display the expected page when increasedRisk is true', () => {
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'B2345YZ',
        band: 1,
      })

      stubLoginAndBrowseToExtremismPage()

      extremismPage = ExtremismPage.createForBookingId(bookingId)
      extremismPage.validateWarningVisibility({ isVisible: true })
      extremismPage.validateWarningText('This person is at risk of engaging in, or vulnerable to, extremism')

      extremismPage.validateInfoVisibility({ isVisible: false })

      extremismPage.validatePreviousTerrorismOffencesTextBox({ isVisible: false })
    })

    it('should display the expected page when increasedRisk is false', () => {
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'B2345YZ',
        band: 4,
      })

      stubLoginAndBrowseToExtremismPage()

      extremismPage = ExtremismPage.createForBookingId(bookingId)
      extremismPage.validateWarningVisibility({ isVisible: false })

      extremismPage.validateInfoVisibility({ isVisible: true })
      extremismPage.validateInfoText(
        'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
      )

      extremismPage.validatePreviousTerrorismOffencesTextBox({ isVisible: false })
    })
  })

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'B2345YZ',
        band: 4,
      })

      stubLoginAndBrowseToExtremismPage()

      extremismPage = ExtremismPage.createForBookingId(bookingId)
      extremismPage.saveAndReturnButton().click()

      extremismPage.validateErrorSummaryMessages([
        { index: 0, href: '#previousTerrorismOffences', text: 'Please select yes or no' },
      ])

      extremismPage.validateErrorMessages([
        { selector: '#previousTerrorismOffences-error', text: 'Please select yes or no' },
      ])
    })

    describe('it should record a valid form submission', () => {
      it("should record a 'yes' decision", () => {
        cy.task('stubGetExtremismProfile', {
          offenderNo: 'B2345YZ',
          band: 1,
        })

        stubLoginAndBrowseToExtremismPage()

        extremismPage = ExtremismPage.createForBookingId(bookingId)
        extremismPage.selectPreviousTerrorismOffencesRadioButton('YES')
        extremismPage.setPreviousTerrorismOffencesText('Some risk text')
        extremismPage.saveAndReturnButton().click()

        taskListPage.extremismLink().click()

        extremismPage.validatePreviousTerrorismOffencesRadioButton({
          selection: ['YES'],
          isChecked: true,
        })

        extremismPage.validatePreviousTerrorismOffencesTextBox({ isVisible: true, expectedText: 'Some risk text' })

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.SECURITY_AUTO.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              extremismRating: { previousTerrorismOffences: 'Yes', previousTerrorismOffencesText: 'Some risk text' },
            },
          })
        })
      })

      it("should record a 'no' decision", () => {
        cy.task('stubGetExtremismProfile', {
          offenderNo: 'B2345YZ',
          band: 4,
        })

        stubLoginAndBrowseToExtremismPage()

        extremismPage = ExtremismPage.createForBookingId(bookingId)
        extremismPage.selectPreviousTerrorismOffencesRadioButton('NO')
        extremismPage.saveAndReturnButton().click()

        taskListPage.extremismLink().click()

        extremismPage.validatePreviousTerrorismOffencesRadioButton({
          selection: ['NO'],
          isChecked: true,
        })

        extremismPage.validatePreviousTerrorismOffencesTextBox({ isVisible: false })

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.STARTED.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              extremismRating: { previousTerrorismOffences: 'No' },
            },
          })
        })
      })
    })

    describe('it should handle validation errors regardless of prisoners previous terrorism offences', () => {
      afterEach(() => {
        stubLoginAndBrowseToExtremismPage()

        extremismPage = ExtremismPage.createForBookingId(bookingId)
        extremismPage.selectPreviousTerrorismOffencesRadioButton('YES')
        extremismPage.saveAndReturnButton().click()

        extremismPage.validateErrorSummaryMessages([
          { index: 0, href: '#previousTerrorismOffencesText', text: 'Please enter the previous offences' },
        ])

        extremismPage.validateErrorMessages([
          { selector: '#previousTerrorismOffencesText-error', text: 'Please enter details' },
        ])
      })

      it('validates when has previous terrorism offences', () => {
        cy.task('stubGetExtremismProfile', {
          offenderNo: 'B2345YZ',
          band: 1,
        })
      })

      it('validates when does not have previous terrorism offences', () => {
        cy.task('stubGetExtremismProfile', {
          offenderNo: 'B2345YZ',
          band: 4,
        })
      })
    })
  })
})
