import CategorisationHomePage from '../../pages/categoriser/home'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment/moment'
import { CATEGORISER_USER, SECURITY_USER, UserAccount } from '../../factory/user'
import Page from '../../pages/page'
import CategoriserSecurityInputPage from '../../pages/form/ratings/categoriserSecurityInputPage'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import SecurityHomePage from '../../pages/security/home'
import AuthSignInPage from '../../pages/authSignIn'
import SecurityReviewPage from '../../pages/form/security/review'
import CategoriserSecurityBackPage, {
  WarrantACategoryBChoice,
} from '../../pages/form/ratings/categoriserSecurityBackPage'

describe('Security Input', () => {
  let categorisationHomePage: CategorisationHomePage
  let categoriserSecurityInputPage: CategoriserSecurityInputPage
  let taskListPage: TaskListPage
  let bookingId: number

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    bookingId = 12

    cy.task('stubUncategorised')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345YZ'],
      bookingIds: [12],
      startDates: [moment('2019-01-28').format('yyyy-MM-dd')],
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
  const stubLoginAndBrowseToCategoriserSecurityInputPage = (
    { user }: { user: UserAccount } = { user: CATEGORISER_USER }
  ) => {
    cy.stubLogin({
      user,
    })
    cy.signIn()

    categorisationHomePage = Page.verifyOnPage(CategorisationHomePage)
    categorisationHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.securityButton().click()
  }

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
      cy.task('stubGetExtremismProfile', {
        offenderNo: 'B2345YZ',
        category: 'C',
        increasedRisk: false,
        notifyRegionalCTLead: false,
      })

      stubLoginAndBrowseToCategoriserSecurityInputPage()

      categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
      categoriserSecurityInputPage.saveAndReturnButton().click()

      categoriserSecurityInputPage.validateErrorSummaryMessages([
        { index: 0, href: '#securityInputNeeded', text: 'Please select yes or no' },
      ])

      categoriserSecurityInputPage.validateErrorMessages([
        { selector: '#securityInputNeeded-error', text: 'Please select yes or no' },
      ])
    })

    describe('it should record a valid form submission', () => {
      it("should record a 'no' decision", () => {
        cy.task('stubGetExtremismProfile', {
          offenderNo: 'B2345YZ',
          category: 'C',
          increasedRisk: true,
          notifyRegionalCTLead: false,
        })

        stubLoginAndBrowseToCategoriserSecurityInputPage()

        categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
        categoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
        categoriserSecurityInputPage.validateSecurityInputTextBox({ isVisible: false })
        categoriserSecurityInputPage.saveAndReturnButton().click()

        taskListPage.securityButton().click()

        categoriserSecurityInputPage.validateSecurityInputRadioButton({
          selection: ['NO'],
          isChecked: true,
        })

        categoriserSecurityInputPage.validateSecurityInputTextBox({
          isVisible: false,
        })

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.STARTED.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              securityInput: { securityInputNeeded: 'No' },
            },
          })
        })
      })

      describe.only("it should record a 'yes' decision", () => {
        beforeEach(() => {
          cy.task('stubGetExtremismProfile', {
            offenderNo: 'B2345YZ',
            category: 'C',
            increasedRisk: true,
            notifyRegionalCTLead: false,
          })

          stubLoginAndBrowseToCategoriserSecurityInputPage()

          categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
          categoriserSecurityInputPage.selectSecurityInputRadioButton('YES')
          categoriserSecurityInputPage.setSecurityInputText('Some security input text')
          categoriserSecurityInputPage.saveAndReturnButton().click()
        })

        it('should display the security referral information on the task list', () => {
          taskListPage.validateButtonState({ buttonSelector: taskListPage.securityButton, isDisabled: true })
          taskListPage.validateSecurityReferralDate(new Date())
        })

        it('should allow a security user to complete their assessment', () => {
          cy.task('stubGetStaffDetailsByUsernameList', {
            usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
          })
          cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345YZ'] })

          taskListPage.signOut().click()
          Page.verifyOnPage(AuthSignInPage)

          cy.stubLogin({
            user: SECURITY_USER,
          })
          cy.signIn()

          const securityHomePage = Page.verifyOnPage(SecurityHomePage)
          securityHomePage.validateCategorisationReferralsToDoTableColumnData([
            {
              columnName: 'Prison no.',
              expectedValues: ['B2345YZ'],
            },
            {
              columnName: 'Referred by',
              expectedValues: ['Firstname_categoriser_user Lastname_categoriser_user'],
            },
          ])
          securityHomePage.getStartButton({ bookingId }).click()

          const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
          securityReviewPage.validateHeaderInitialNote({ isVisible: true, expectedText: 'Note from categoriser' })
          securityReviewPage.validateParagraphInitialNote({ isVisible: true, expectedText: 'Some security input text' })
          securityReviewPage.validateParagraphInitialManual({
            isVisible: true,
            expectedText: 'Manually sent for review',
          })
          securityReviewPage.setSecurityInformationText('security info text')
          securityReviewPage.saveAndSubmitButton().click()

          securityHomePage.validateNoReferralsToReview()
        })

        describe('categoriser journey after security approval', () => {
          let securityBackPage: CategoriserSecurityBackPage

          beforeEach(() => {
            cy.task('stubGetStaffDetailsByUsernameList', {
              usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
            })
            cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345YZ'] })

            taskListPage.signOut().click()

            cy.stubLogin({
              user: SECURITY_USER,
            })
            cy.signIn()

            const securityHomePage = Page.verifyOnPage(SecurityHomePage)
            securityHomePage.getStartButton({ bookingId }).click()

            const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
            securityReviewPage.setSecurityInformationText('security info text')
            securityReviewPage.saveAndSubmitButton().click()

            cy.stubLogin({
              user: CATEGORISER_USER,
            })
            cy.signIn()

            categorisationHomePage.selectPrisonerWithBookingId(bookingId, 'Edit')

            taskListPage.securityButton().click()

            securityBackPage = CategoriserSecurityBackPage.createForBookingId(bookingId)
            securityBackPage.validateNoteFromSecurity(['Some security input text', 'security info text'])
            securityBackPage.validateSecurityInputRadioButton({
              selection: ['YES', 'NO'],
              isChecked: false,
            })
          })

          it('should require a category radio button choice', () => {
            securityBackPage.saveAndReturnButton().click()

            securityBackPage.validateErrorSummaryMessages([
              { index: 0, href: '#catB', text: 'Please select yes or no' },
            ])

            securityBackPage.validateErrorMessages([{ selector: '#catB-error', text: 'Select yes or no' }])
          })

          // -- spacer
          ;['YES', 'NO'].forEach((warrantsACategoryBChoice: WarrantACategoryBChoice) => {
            it(`should allow a categoriser to enter a category decision: ${warrantsACategoryBChoice}`, () => {
              securityBackPage.selectedWarrantACategoryBRadioButton(warrantsACategoryBChoice)
              securityBackPage.saveAndReturnButton().click()

              taskListPage.securityButton()
              taskListPage.validateSecurityCompletedDate(new Date())
              taskListPage.securityButton().should('contain.text', 'Edit')

              cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
                expect(result.rows[0].status).to.eq('SECURITY_BACK')
                expect(result.rows[0].referred_by).to.eq('CATEGORISER_USER')
                expect(result.rows[0].security_reviewed_by).to.eq('SECURITY_USER')
                expect(result.rows[0].cat_type).to.eq('INITIAL')
                expect(moment(result.rows[0].start_date).isSame(new Date(), 'day')).to.eq(true)
                expect(moment(result.rows[0].referred_date).isSame(new Date(), 'day')).to.eq(true)
                expect(moment(result.rows[0].security_reviewed_date).isSame(new Date(), 'day')).to.eq(true)
                expect(result.rows[0].form_response).to.deep.eq({
                  ratings: {
                    securityBack: {
                      catB: warrantsACategoryBChoice === 'YES' ? 'Yes' : 'No',
                    },
                    securityInput: {
                      securityInputNeeded: 'Yes',
                      securityInputNeededText: 'Some security input text',
                    },
                  },
                  security: {
                    review: {
                      securityReview: 'security info text',
                    },
                  },
                })
              })

              taskListPage.securityButton().click()

              securityBackPage.validateSecurityInputRadioButton({
                selection: [warrantsACategoryBChoice],
                isChecked: true,
              })
            })
          })
        })
      })
    })
  })
})
