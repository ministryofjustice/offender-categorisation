import { CASELOAD } from '../../factory/caseload'
import { CATEGORISER_USER, SUPERVISOR_USER } from '../../factory/user'
import dbSeeder from '../../fixtures/db-seeder'
import initialCategorisation from '../../fixtures/recategoriser/initialCategorisation'
import Page from '../../pages/page'
import SupervisorHomePage from '../../pages/supervisor/home'
import SupervisorReviewPage from '../../pages/form/supervisor/review'
import FurtherInformationPage from '../../pages/form/supervisor/furtherInformation'
import SupervisorReviewOutcomePage from '../../pages/form/supervisor/outcome'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import GiveBackToCategoriserPage from '../../pages/form/supervisor/giveBackToCategoriser'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import SupervisorConfirmBackPage from '../../pages/form/supervisor/confirmBack'
import Status from '../../../server/utils/statusEnum'
import youngOffender from '../../fixtures/categoriser/youngOffender'
import GiveBackToCategoriserOutcome from '../../pages/form/supervisor/giveBackToCategoriserOutcome'

const commonColumn2 = [
  {
    key: 'Location',
    value: `C-04-02`,
  },
  {
    key: 'Location',
    value: `Coventry`,
  },
  {
    key: 'Nationality',
    value: `Latvian`,
  },
  {
    key: 'Main offence',
    value: `A Felony`,
  },
  {
    key: 'Main offence',
    value: `Another Felony`,
  },
]

describe('Supervisor Review', () => {
  const bookingId = 12
  let offenderNo = 'B2345YZ'
  let category: string

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('reset')
    cy.task('setUpDb')
  })

  const loginAsSupervisorUser = ({
    youngOffender = false,
    indeterminateSentence = false,
  }: {
    youngOffender: boolean
    indeterminateSentence: boolean
  }) => {
    const sentenceStartDate11 = new Date('2019-01-28')
    const sentenceStartDate12 = new Date('2019-01-31')

    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [sentenceStartDate11, sentenceStartDate12],
    })
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY'],
      bookingIds: [11],
      startDates: [sentenceStartDate11],
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubGetOffenderDetails', { bookingId, offenderNo, youngOffender, indeterminateSentence })

    cy.task('stubGetSocProfile', {
      offenderNo,
      category,
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo,
      category,
      increasedRisk: false,
      notifyRegionalCTLead: false,
    })
    cy.task('stubAssessments', { offenderNumber: offenderNo, bookingId })
    cy.task('stubAgencyDetails', { agency: CASELOAD.LPI.id })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: offenderNo, formattedReleaseDate: '2014-11-23' })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()
  }

  it('should require a supervisor decision', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.submitButton().click()

    supervisorReviewPage.validateErrorSummaryMessages([
      { index: 0, href: '#supervisorDecision', text: 'Select what you would like to do next' },
    ])

    supervisorReviewPage.validateErrorMessages([
      {
        selector: '#supervisorDecision-error',
        text: 'Select what you would like to do next',
      },
    ])
  })

  it('should allow a supervisor to approve a categorisation', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    cy.validateCategorisationDetails([
      // column 1
      [
        { key: 'Name', value: 'Hillmob, Ant' },
        { key: 'NOMIS ID', value: offenderNo },
        { key: 'Date of birth', value: '17/02/1970' },
        { key: 'Current category', value: 'C' },
      ],
      // column 2
      commonColumn2,
      // column 3
      [
        { key: 'HDC Eligibility Date', value: '10/06/2020' },
        { key: 'Automatic Release Date', value: '11/06/2020' },
        { key: 'Conditional Release Date', value: '02/02/2020' },
        { key: 'Parole Eligibility Date', value: '13/06/2020' },
        { key: 'Non Parole Date', value: '14/06/2020' },
        { key: 'ISP Tariff End Date', value: '15/06/2020' },
        { key: 'Licence Expiry Date', value: '16/06/2020' },
        { key: 'Sentence Expiry Date', value: '17/06/2020' },
      ],
    ])
    // Court-issued sentence
    ;[
      {
        columnName: 'Line',
        expectedValues: ['2'],
      },
      {
        columnName: 'Start',
        expectedValues: ['31/12/2018'],
      },
      {
        columnName: 'Length of sentence',
        expectedValues: ['6 years, 3 months'],
      },
      {
        columnName: 'Consecutive to (line)',
        expectedValues: [''],
      },
      {
        columnName: 'Type',
        expectedValues: ['Std sentence'],
      },
    ].forEach(cy.checkTableColumnTextValues)
    ;[
      // Prisoner Background
      { term: 'Reason for review', definition: 'Review due' },
      {
        term: 'Categorisation history',
        definition:
          'Categorisation date Category decision Review location 24/03/2013 B LPI prison 08/06/2012 A LPI prison',
      },
      {
        term: 'Safety and good order',
        definition: 'This person has not been reported as the perpetrator in any assaults in custody before',
      },
      {
        term: 'Risk of escape',
        definition: 'This person is not on the E-List and does not have an Escape Risk Alert.',
      },
      {
        term: 'Extremism',
        definition:
          'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
      },
      { term: 'Offence details for active sentences', definition: 'test' },
      // OASYS
      { term: 'Was there any information in their OASYs that is relevant to the recategorisation?', definition: 'No' },

      // Security information
      { term: 'Automatic referral to security team', definition: 'No' },
      { term: 'Manual referral to security team', definition: 'Yes' },
      { term: 'Flagged by security team', definition: 'No' },
      { term: 'Security comments', definition: 'test' },
      // risk assessment
      { term: 'Could they be managed in a lower security category?', definition: 'test' },
      {
        term: 'Should they remain in their current security category? Or be put in a higher security category?',
        definition: 'test',
      },
      { term: 'Other relevant information', definition: 'No' },
      // category decision
      { term: 'What security category is most suitable for this person?', definition: 'Category C' },
      { term: 'Information about why this category is appropriate', definition: 'test' },
      // next category review date
      { term: 'What date should they be reviewed by?', definition: 'Saturday 14 December 2019' },
    ].forEach(cy.checkDefinitionList)

    cy.contains('The categoriser recommends Category C')

    cy.task('stubSupervisorApprove')

    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
    supervisorReviewPage.submitButton().click()

    const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
    furtherInformationPage.enterFurtherInformation('Some further information')
    furtherInformationPage.submitButton().click()

    const supervisorReviewOutcomePage = SupervisorReviewOutcomePage.createForBookingIdAndCategorisationType(
      bookingId,
      CATEGORISATION_TYPE.INITIAL,
    )
    supervisorReviewOutcomePage.finishButton().should('be.visible')
  })

  it('should allow a supervisor to override to B from C without passing back to a pom', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    cy.task('stubSupervisorApprove')

    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_B').click()
    supervisorReviewPage.submitButton().click()

    const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(bookingId, 'Change to Category B')
    giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('NO')
    giveBackToCategoriserPage.submitButton().click()

    giveBackToCategoriserPage.validateErrorSummaryMessages([
      {
        index: 0,
        href: '#supervisorOverriddenCategoryText',
        text: 'Enter the reason why this category is more appropriate',
      },
    ])

    giveBackToCategoriserPage.validateErrorMessages([
      {
        selector: '#supervisorOverriddenCategoryText-error',
        text: 'Enter the reason why this category is more appropriate',
      },
    ])

    cy.get('#supervisorOverriddenCategoryText').type('some justification of category change')
    giveBackToCategoriserPage.submitButton().click()

    const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
    furtherInformationPage.enterFurtherInformation('Some further information')
    furtherInformationPage.submitButton().click()

    cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
      expect(result.rows[0].status).to.eq(Status.APPROVED.name)
      expect(result.rows[0].form_response.supervisor).to.deep.eq({
        review: {
          supervisorDecision: 'changeCategoryTo_B',
          supervisorOverriddenCategory: 'B',
          supervisorCategoryAppropriate: 'No',
        },
        changeCategory: {
          giveBackToCategoriser: 'No',
          supervisorOverriddenCategoryText: 'some justification of category change',
        },
        furtherInformation: {
          otherInformationText: 'Some further information',
        },
      })
      expect(result.rows[0].approved_by).to.eq(SUPERVISOR_USER.username)
    })
  })

  it('should allow a supervisor to override to B from C and pass back to a pom', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    cy.task('stubSupervisorReject')

    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_B').click()
    supervisorReviewPage.submitButton().click()

    const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(bookingId, 'Change to Category B')
    giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('YES')
    giveBackToCategoriserPage.submitButton().click()

    const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
    supervisorConfirmBackPage.setConfirmationMessageText('A reason why I believe this is a more appropriate category')
    supervisorConfirmBackPage.saveAndReturnButton().click()

    const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
      bookingId,
      CATEGORISATION_TYPE.RECAT,
    )
    giveBackToCategoriserOutcomePage.finishButton().should('be.visible')

    cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
      expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
      expect(result.rows[0].form_response.supervisor).to.deep.eq({
        review: {
          supervisorDecision: 'changeCategoryTo_B',
          supervisorOverriddenCategory: 'B',
          supervisorCategoryAppropriate: 'No',
        },
        changeCategory: {
          giveBackToCategoriser: 'Yes',
        },
        confirmBack: {
          supervisorName: 'Test User',
          messageText: 'A reason why I believe this is a more appropriate category',
        },
      })
      expect(result.rows[0].form_response.openConditionsRequested).to.eq(undefined)
    })
  })

  it('should allow a supervisor to override to D from C, having to pass back to a pom to complete open conditions', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    cy.task('stubSupervisorReject')

    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_D').click()
    supervisorReviewPage.submitButton().click()

    const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
    supervisorConfirmBackPage.saveAndReturnButton().click()

    supervisorReviewPage.validateErrorSummaryMessages([
      { index: 0, href: '#messageText', text: 'Enter your message for the categoriser' },
    ])

    supervisorReviewPage.validateErrorMessages([
      {
        selector: '#messageText-error',
        text: 'Enter your message for the categoriser',
      },
    ])

    supervisorConfirmBackPage.setConfirmationMessageText('A reason why I believe this is a more appropriate category')
    supervisorConfirmBackPage.saveAndReturnButton().click()

    const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
      bookingId,
      CATEGORISATION_TYPE.RECAT,
    )
    giveBackToCategoriserOutcomePage.finishButton().should('be.visible')

    cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
      expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
      expect(result.rows[0].form_response.supervisor).to.deep.eq({
        review: {
          supervisorDecision: 'changeCategoryTo_D',
          supervisorOverriddenCategory: 'D',
          supervisorCategoryAppropriate: 'No',
        },
        confirmBack: {
          supervisorName: 'Test User',
          messageText: 'A reason why I believe this is a more appropriate category',
        },
      })
      expect(result.rows[0].form_response.openConditionsRequested).to.eq(true)
      expect(result.rows[0].form_response.recat.decision).to.eq(undefined)
    })
  })

  it('should allow a supervisor to request more information from the categoriser', () => {
    dbSeeder(initialCategorisation('C'))

    loginAsSupervisorUser({ youngOffender: false, indeterminateSentence: false })

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.startReviewForPrisoner(bookingId)
    cy.task('stubSupervisorReject')

    const supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)

    supervisorReviewPage.supervisorDecisionRadioButton('GIVE_BACK_TO_CATEGORISER').click()
    supervisorReviewPage.submitButton().click()

    const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
    supervisorConfirmBackPage.saveAndReturnButton().click()

    supervisorReviewPage.validateErrorSummaryMessages([
      { index: 0, href: '#messageText', text: 'Enter your message for the categoriser' },
    ])

    supervisorReviewPage.validateErrorMessages([
      {
        selector: '#messageText-error',
        text: 'Enter your message for the categoriser',
      },
    ])

    supervisorConfirmBackPage.setConfirmationMessageText('Give me more information')
    supervisorConfirmBackPage.saveAndReturnButton().click()

    const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
      bookingId,
      CATEGORISATION_TYPE.RECAT,
    )
    giveBackToCategoriserOutcomePage.finishButton().should('be.visible')

    cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
      expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
      expect(result.rows[0].form_response).to.deep.eq({
        recat: {
          decision: { category: 'C', justification: 'test' },
          oasysInput: { date: '04/05/2025', oasysRelevantInfo: 'No' },
          securityInput: { securityNoteNeeded: 'No', securityInputNeeded: 'Yes' },
          nextReviewDate: { date: '14/12/2019', indeterminate: 'false' },
          riskAssessment: { lowerCategory: 'test', otherRelevant: 'No', higherCategory: 'test', otherRelevantText: '' },
          prisonerBackground: { offenceDetails: 'test' },
        },
        security: { review: { securityReview: 'test' } },
        supervisor: {
          review: {
            supervisorDecision: 'requestMoreInformation',
          },
          confirmBack: {
            messageText: 'Give me more information',
            supervisorName: 'Test User',
          },
        },
      })
    })
  })

  describe('Young Offenders (YOI)', () => {
    let supervisorReviewPage: SupervisorReviewPage

    describe('form submission', () => {
      beforeEach(() => {
        dbSeeder(youngOffender)

        loginAsSupervisorUser({
          youngOffender: true,
          indeterminateSentence: true,
        })

        const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
        supervisorHomePage.startReviewForPrisoner(bookingId)

        supervisorReviewPage = SupervisorReviewPage.createForBookingId(bookingId)
        supervisorReviewPage.validateIndeterminateWarningIsDisplayed({ isVisible: false })
        supervisorReviewPage.validateWhichCategoryIsMoreAppropriateRadioButton({
          selection: ['CHANGE_TO_CATEGORY_J', 'CHANGE_TO_CATEGORY_C', 'CHANGE_TO_CATEGORY_B', 'CHANGE_TO_CATEGORY_D'],
          isChecked: false,
        })
      })

      it('should require a provisional category selection', () => {
        supervisorReviewPage.submitButton().click()

        supervisorReviewPage.validateErrorSummaryMessages([
          { index: 0, href: '#supervisorDecision', text: 'Select what you would like to do next' },
        ])

        supervisorReviewPage.validateErrorMessages([
          {
            selector: '#supervisorDecision-error',
            text: 'Select what you would like to do next',
          },
        ])
      })

      it('should accept an agreement with the provisional category', () => {
        cy.task('stubSupervisorApprove')

        supervisorReviewPage.supervisorDecisionRadioButton('AGREE_WITH_CATEGORY_DECISION').click()
        supervisorReviewPage.submitButton().click()

        const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
        furtherInformationPage.enterFurtherInformation('Some further information')
        furtherInformationPage.submitButton().click()

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.APPROVED.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              decision: { category: 'I' },
              escapeRating: { escapeOtherEvidence: 'No' },
              securityInput: { securityInputNeeded: 'No' },
              nextReviewDate: { date: '14/12/2019' },
              violenceRating: { seriousThreat: 'No', highRiskOfViolence: 'No' },
              extremismRating: { previousTerrorismOffences: 'Yes' },
              offendingHistory: { previousConvictions: 'No' },
            },
            supervisor: {
              review: { supervisorDecision: 'agreeWithCategoryDecision' },
              furtherInformation: { otherInformationText: 'Some further information' },
            },
            categoriser: { provisionalCategory: { suggestedCategory: 'I', categoryAppropriate: 'Yes' } },
          })
          expect(result.rows[0].assigned_user_id).to.eq(CATEGORISER_USER.username)
          expect(result.rows[0].approved_by).to.eq(SUPERVISOR_USER.username)
        })
      })

      it('should allow the supervisor to return the categorisation request to the categoriser', () => {
        cy.task('stubSupervisorReject')
        const confirmBackMessage = 'a message to pass back to the categoriser'

        supervisorReviewPage.supervisorDecisionRadioButton('GIVE_BACK_TO_CATEGORISER').click()
        supervisorReviewPage.submitButton().click()

        const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
        supervisorConfirmBackPage.setConfirmationMessageText(confirmBackMessage)
        supervisorConfirmBackPage.saveAndReturnButton().click()

        const giveBackToCategoriserOutcomePage = GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(
          bookingId,
          CATEGORISATION_TYPE.RECAT,
        )
        giveBackToCategoriserOutcomePage.finishButton().should('be.visible')

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
          expect(result.rows[0].assigned_user_id).to.eq(CATEGORISER_USER.username)
          expect(result.rows[0].approved_by).to.eq(null)
          expect(result.rows[0].form_response.supervisor.confirmBack.messageText).to.eq(confirmBackMessage)
        })
      })

      describe('Do you agree with the provisional category? No', () => {
        describe('YOI Open', () => {
          it('should return the category change to the categoriser to provide the Open information', () => {
            cy.task('stubSupervisorReject')

            supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_J').click()
            supervisorReviewPage.validateIndeterminateWarningIsDisplayed({
              isVisible: true,
              expectedText: `This person is serving an indeterminate sentence, and local establishments are not responsible for assessing their suitability for open conditions. You should categorise them to open conditions only if the Parole Board or Public Protection Casework Section has decided they are suitable.`,
            })
            supervisorReviewPage.submitButton().click()

            const supervisorConfirmBackPage = SupervisorConfirmBackPage.createForBookingId(bookingId)
            supervisorConfirmBackPage.setConfirmationMessageText(
              'A reason why I believe this is a more appropriate category',
            )
            supervisorConfirmBackPage.saveAndReturnButton().click()

            const giveBackToCategoriserOutcomePage =
              GiveBackToCategoriserOutcome.createForBookingIdAndCategorisationType(bookingId, CATEGORISATION_TYPE.RECAT)
            giveBackToCategoriserOutcomePage.finishButton().should('be.visible')

            cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
              expect(result.rows[0].status).to.eq(Status.SUPERVISOR_BACK.name)
              expect(result.rows[0].form_response).to.deep.eq({
                ratings: {
                  escapeRating: {
                    escapeOtherEvidence: 'No',
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
                supervisor: {
                  review: {
                    supervisorDecision: 'changeCategoryTo_J',
                    supervisorOverriddenCategory: 'J',
                    supervisorCategoryAppropriate: 'No',
                  },
                  confirmBack: {
                    supervisorName: 'Test User',
                    messageText: 'A reason why I believe this is a more appropriate category',
                  },
                },
                categoriser: {
                  provisionalCategory: {
                    categoryAppropriate: 'Yes',
                  },
                },
                openConditionsRequested: true,
              })
              expect(result.rows[0].assigned_user_id).to.eq(CATEGORISER_USER.username)
              expect(result.rows[0].approved_by).to.eq(null)
            })
          })
        })

        describe('Consider for Category C', () => {
          it('without giving back to categoriser', () => {
            cy.task('stubSupervisorApprove')

            supervisorReviewPage.supervisorDecisionRadioButton('CHANGE_TO_CATEGORY_C').click()
            supervisorReviewPage.validateIndeterminateWarningIsDisplayed({ isVisible: false })
            supervisorReviewPage.submitButton().click()

            const giveBackToCategoriserPage = GiveBackToCategoriserPage.createForBookingId(
              bookingId,
              'Change to Category C',
            )
            giveBackToCategoriserPage.selectGiveBackToCategoriserRadioButton('NO')
            cy.get('#supervisorOverriddenCategoryText').type('some justification of category change')
            giveBackToCategoriserPage.submitButton().click()

            const furtherInformationPage = FurtherInformationPage.createForBookingId(bookingId)
            furtherInformationPage.enterFurtherInformation('A reason why I believe this is a more appropriate category')
            furtherInformationPage.submitButton().click()

            const supervisorReviewOutcomePage = SupervisorReviewOutcomePage.createForBookingIdAndCategorisationType(
              bookingId,
              CATEGORISATION_TYPE.INITIAL,
            )
            supervisorReviewOutcomePage.finishButton().should('be.visible')

            cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
              expect(result.rows[0].status).to.eq(Status.APPROVED.name)
              expect(result.rows[0].assigned_user_id).to.eq(CATEGORISER_USER.username)
              expect(result.rows[0].approved_by).to.eq(SUPERVISOR_USER.username)
              expect(result.rows[0].form_response).to.deep.eq({
                ratings: {
                  decision: {
                    category: 'I',
                  },
                  escapeRating: {
                    escapeOtherEvidence: 'No',
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
                supervisor: {
                  review: {
                    supervisorDecision: 'changeCategoryTo_C',
                    supervisorOverriddenCategory: 'C',
                    supervisorCategoryAppropriate: 'No',
                  },
                  changeCategory: {
                    giveBackToCategoriser: 'No',
                    supervisorOverriddenCategoryText: 'some justification of category change',
                  },
                  furtherInformation: {
                    otherInformationText: 'A reason why I believe this is a more appropriate category',
                  },
                },
                categoriser: {
                  provisionalCategory: {
                    suggestedCategory: 'I',
                    categoryAppropriate: 'Yes',
                  },
                },
              })
            })
          })
        })
      })
    })
  })
})
