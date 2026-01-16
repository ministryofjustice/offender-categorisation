import CategoriserHomePage from '../../pages/categoriser/home'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment/moment'
import { CATEGORISER_USER, SECURITY_USER, SUPERVISOR_USER, UserAccount } from '../../factory/user'
import Page from '../../pages/page'
import CategoriserSecurityInputPage from '../../pages/form/ratings/categoriserSecurityInputPage'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import SecurityHomePage from '../../pages/security/home'
import AuthSignInPage from '../../pages/authSignIn'
import SecurityReviewPage from '../../pages/form/security/review'
import CategoriserReviewCYAPage from '../../pages/form/categoriser/review'
import CategoriserSecurityBackPage, {
  WarrantACategoryBChoice,
} from '../../pages/form/ratings/categoriserSecurityBackPage'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'

describe('Security Input', () => {
  let categoriserHomePage: CategoriserHomePage
  let categoriserSecurityInputPage: CategoriserSecurityInputPage
  let taskListPage: TaskListPage
  let bookingId: number

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  beforeEach(() => {
    bookingId = 12

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

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
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetAssaultIncidents', {
      prisonerNumber: 'B2345YZ',
      assaultIncidents: [],
    })
    cy.task('stubGetViperData', {
      prisonerNumber: 'B2345YZ',
      aboveThreshold: false,
    })
    cy.task('stubGetCategoryHistory')

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId,
      nomisSequenceNumber: 5,
      catType: CATEGORISATION_TYPE.INITIAL,
      offenderNo: 'B2345YZ',
      sequenceNumber: 5,
      status: Status.STARTED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'C',
            overriddenCategory: 'D',
            categoryAppropriate: 'No',
            otherInformationText: 'over ridden category text',
          },
        },
        ratings: {
          offendingHistory: {
            previousConvictions: 'Yes',
            previousConvictionsText: 'some convictions',
          },
          securityInput: {},
          furtherCharges: {
            furtherCharges: 'Yes',
            furtherChargesText: 'some charges',
          },
          violenceRating: {
            highRiskOfViolence: 'No',
            seriousThreat: 'Yes',
          },
          escapeRating: {
            escapeOtherEvidence: 'Yes',
            escapeOtherEvidenceText: 'evidence details',
            escapeCatB: 'Yes',
            escapeCatBText: 'cat b details',
          },
          extremismRating: {
            previousTerrorismOffences: 'Yes',
          },
          nextReviewDate: {
            date: '14/12/2019',
          },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
    })
  })

  /**
   * Extracted to a separate step as some of the stubbing needs to differ between tests before
   * this point is reached.
   */
  const stubLoginAndBrowseToCategoriserSecurityInputPage = (
    { user }: { user: UserAccount } = { user: CATEGORISER_USER },
  ) => {
    cy.stubLogin({
      user,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId, 'Edit')

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.securityLink().click()
  }

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
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
      it("should record a 'no' decision and display correctly on the check your answers page", () => {
        stubLoginAndBrowseToCategoriserSecurityInputPage()

        categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
        categoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
        categoriserSecurityInputPage.validateSecurityInputTextBox({ isVisible: false })
        categoriserSecurityInputPage.saveAndReturnButton().click()

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.STARTED.name)
          expect(result.rows[0].form_response.ratings).to.deep.include({
            securityInput: { securityInputNeeded: 'No' },
          })
        })

        taskListPage.securityLink().click()

        categoriserSecurityInputPage.validateSecurityInputRadioButton({
          selection: ['NO'],
          isChecked: true,
        })

        categoriserSecurityInputPage.validateSecurityInputTextBox({
          isVisible: false,
        })

        categoriserSecurityInputPage.saveAndReturnButton().click()
        taskListPage.checkAndSubmitCategorisationLink(12).click()

        const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(12, 'you continue')
        categoriserReviewCYAPage.validateSecurityInputSummary([
          { question: 'Automatic referral to security team', expectedAnswer: 'No' },
          { question: 'Manual referral to security team', expectedAnswer: 'No' },
          { question: 'Flagged by security team', expectedAnswer: 'No' },
        ])
      })

      it('should display error if no security input text is given', () => {
        stubLoginAndBrowseToCategoriserSecurityInputPage()

        categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
        categoriserSecurityInputPage.selectSecurityInputRadioButton('YES')
        categoriserSecurityInputPage.saveAndReturnButton().click()

        categoriserSecurityInputPage.validateErrorSummaryMessages([
          { index: 0, href: '#securityInputNeededText', text: 'Please enter the reason why referral is needed' },
        ])

        categoriserSecurityInputPage.validateErrorMessages([
          { selector: '#securityInputNeededText-error', text: 'Please enter details' },
        ])
      })

      describe("it should record a 'yes' decision", () => {
        beforeEach(() => {
          stubLoginAndBrowseToCategoriserSecurityInputPage()

          categoriserSecurityInputPage = CategoriserSecurityInputPage.createForBookingId(bookingId)
          categoriserSecurityInputPage.selectSecurityInputRadioButton('YES')
          categoriserSecurityInputPage.setSecurityInputText('Some security input text')
          categoriserSecurityInputPage.saveAndReturnButton().click()
        })

        it('should display the security referral information on the task list', () => {
          taskListPage.validateSecurityReferralDate(new Date())
        })

        it('should allow a security user to complete their assessment', () => {
          cy.task('stubSubmitSecurityReview', { bookingId })
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
              columnName: 'Name and prison number',
              expectedValues: ['Clark, FrankB2345YZ'],
            },
            {
              columnName: 'Referred by',
              expectedValues: ['Firstname_categoriser_user Lastname_categoriser_user'],
            },
          ])
          securityHomePage.getStartButton({ bookingId }).click()

          const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
          securityReviewPage.validateHeaderInitialNote({ isVisible: true, expectedText: 'Note from categoriser' })
          const testSecurityText = 'Some security input text'
          securityReviewPage.validateParagraphInitialNote({ isVisible: true, expectedText: testSecurityText })
          securityReviewPage.validateParagraphInitialManual({
            isVisible: true,
            expectedText: 'Manually sent for review',
          })
          securityReviewPage.setSecurityInformationText(testSecurityText)
          cy.task('updateFormRecord', {
            bookingId,
            status: Status.SECURITY_BACK.name,
            formResponse: { security: { review: { securityReview: testSecurityText } } },
          })
          securityReviewPage.saveAndSubmitButton().click()

          securityHomePage.validateNoReferralsToReview()
        })

        describe('categoriser journey after security approval', () => {
          let securityBackPage: CategoriserSecurityBackPage

          beforeEach(() => {
            cy.task('stubSubmitSecurityReview', { bookingId })
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
            const testSecurityText = 'Some security input text'

            const securityReviewPage = SecurityReviewPage.createForBookingId(bookingId)
            securityReviewPage.setSecurityInformationText('security info text')
            cy.task('updateFormRecord', {
              bookingId,
              status: Status.SECURITY_BACK.name,
              formResponse: { security: { review: { securityReview: `${testSecurityText} security info text` } } },
            })
            securityReviewPage.saveAndSubmitButton().click()

            cy.stubLogin({
              user: CATEGORISER_USER,
            })
            cy.signIn()

            categoriserHomePage.selectPrisonerWithBookingId(bookingId, 'Edit')

            taskListPage.securityLink().click()

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
            it(`should allow a categoriser to enter a category decision: ${warrantsACategoryBChoice} and display correctly on the check your answers page`, () => {
              securityBackPage.selectedWarrantACategoryBRadioButton(warrantsACategoryBChoice)
              securityBackPage.saveAndReturnButton().click()

              taskListPage.securityLink()
              taskListPage.securityLink().should('contain.text', 'Security information')

              cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
                const row = result.rows[0]

                expect(row.referred_by).to.eq('CATEGORISER_USER')
                expect(row.cat_type).to.eq('INITIAL')
                expect(moment(row.start_date).isSame(new Date(), 'day')).to.eq(true)
                expect(moment(row.referred_date).isSame(new Date(), 'day')).to.eq(true)

                expect(row.form_response.ratings).to.deep.include({
                  securityBack: {
                    catB: warrantsACategoryBChoice === 'YES' ? 'Yes' : 'No',
                  },
                  securityInput: {
                    securityInputNeeded: 'Yes',
                    securityInputNeededText: 'Some security input text',
                  },
                })

                expect(row.form_response.security).to.deep.include({
                  review: {
                    securityReview: 'Some security input text security info text',
                  },
                })
              })

              taskListPage.securityLink().click()

              securityBackPage.validateSecurityInputRadioButton({
                selection: [warrantsACategoryBChoice],
                isChecked: true,
              })

              securityBackPage.saveAndReturnButton().click()
              taskListPage.checkAndSubmitCategorisationLink(bookingId).click()

              const categoriserReviewCYAPage = CategoriserReviewCYAPage.createForBookingId(bookingId, 'you continue')

              categoriserReviewCYAPage.validateSecurityInputSummary([
                {
                  question: 'Automatic referral to security team',
                  expectedAnswer: 'No',
                },
                {
                  question: 'Manual referral to security team',
                  expectedAnswer: 'Yes',
                },
                {
                  question: 'Flagged by security team',
                  expectedAnswer: 'No',
                },
                {
                  question: 'Security comments',
                  expectedAnswer: 'Some security input text security info text',
                },
                {
                  question: 'Warrant category B?',
                  expectedAnswer: warrantsACategoryBChoice === 'YES' ? 'Yes' : 'No',
                },
              ])
            })
          })
        })
      })
    })
  })
})
