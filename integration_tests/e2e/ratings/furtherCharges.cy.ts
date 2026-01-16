import CategoriserHomePage from '../../pages/categoriser/home'
import FurtherChargesPage, { FurtherChargesCategoryBAppropriateChoice } from '../../pages/form/ratings/furtherCharges'
import TaskListPage from '../../pages/taskList/taskList'
import moment from 'moment'
import { CATEGORISER_USER } from '../../factory/user'
import Page from '../../pages/page'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'

describe('Further Charges', () => {
  let categoriserHomePage: CategoriserHomePage
  let furtherChargesPage: FurtherChargesPage
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
    cy.task('stubGetOcgmAlert', {
      offenderNo: 'B2345YZ',
      transferToSecurity: false,
    })

    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    cy.task('stubGetExtremismProfile', {
      offenderNo: 'B2345YZ',
      band: 1,
    })

    cy.stubLogin({
      user: CATEGORISER_USER,
    })
    cy.signIn()

    categoriserHomePage = Page.verifyOnPage(CategoriserHomePage)
    categoriserHomePage.selectPrisonerWithBookingId(bookingId)

    taskListPage = TaskListPage.createForBookingId(bookingId)
    taskListPage.furtherChargesLink().click()
  })

  describe('form submission', () => {
    it('should show a validation error on empty form submission', () => {
      furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
      furtherChargesPage.saveAndReturnButton().click()

      furtherChargesPage.validateErrorSummaryMessages([
        { index: 0, href: '#furtherCharges', text: 'Please select yes or no' },
      ])

      furtherChargesPage.validateErrorMessages([{ selector: '#furtherCharges-error', text: 'Please select yes or no' }])
    })

    describe("validate a 'yes' response without the necessary further information given", () => {
      it('should require both details text input, and further charges appropriate radio input', () => {
        furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
        furtherChargesPage.selectFurtherChargesRadioButton('YES')

        furtherChargesPage.saveAndReturnButton().click()

        furtherChargesPage.validateErrorSummaryMessages([
          { index: 0, href: '#furtherChargesText', text: 'Please enter details of the further charges' },
          { index: 1, href: '#furtherChargesCatB', text: 'Please select yes or no' },
        ])

        furtherChargesPage.validateErrorMessages([
          { selector: '#furtherChargesText-error', text: 'Please enter details' },
          { selector: '#furtherChargesCatB-error', text: 'Please select yes or no' },
        ])
      })
      // -- spacer to avoid prettier removing the line
      ;['YES', 'NO'].forEach(catBChargesAppropriateSelection => {
        it(`should require details text input when only given further charges appropriate radio input: ${catBChargesAppropriateSelection}`, () => {
          furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
          furtherChargesPage.selectFurtherChargesRadioButton('YES')
          furtherChargesPage.selectFurtherChargesCategoryBAppropriateRadioButton(
            catBChargesAppropriateSelection as FurtherChargesCategoryBAppropriateChoice,
          )

          furtherChargesPage.saveAndReturnButton().click()

          furtherChargesPage.validateErrorSummaryMessages([
            { index: 0, href: '#furtherChargesText', text: 'Please enter details of the further charges' },
          ])

          furtherChargesPage.validateErrorMessages([
            { selector: '#furtherChargesText-error', text: 'Please enter details' },
          ])
        })
      })

      it(`should require further charges appropriate radio input when only given details text input`, () => {
        furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
        furtherChargesPage.selectFurtherChargesRadioButton('YES')
        furtherChargesPage.setFurtherChargesCategoryBAppropriateText('There are further charges')

        furtherChargesPage.saveAndReturnButton().click()

        furtherChargesPage.validateErrorSummaryMessages([
          { index: 0, href: '#furtherChargesCatB', text: 'Please select yes or no' },
        ])

        furtherChargesPage.validateErrorMessages([
          { selector: '#furtherChargesCatB-error', text: 'Please select yes or no' },
        ])
      })
    })

    describe('valid submissions', () => {
      it("should accept a 'no' choice", () => {
        furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
        furtherChargesPage.selectFurtherChargesRadioButton('NO')

        furtherChargesPage.saveAndReturnButton().click()

        taskListPage.furtherChargesLink().click()

        furtherChargesPage.validateFurtherChargesRadioButton({
          selection: ['NO'],
          isChecked: true,
        })

        furtherChargesPage.validateFurtherChargesCategoryBAppropriateTextBox({ isVisible: false })

        cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
          expect(result.rows[0].status).to.eq(Status.SECURITY_AUTO.name)
          expect(result.rows[0].form_response).to.deep.eq({
            ratings: {
              furtherCharges: { furtherCharges: 'No' },
            },
          })
        })
      })

      describe("it should handle a 'yes' choice", () => {
        it('should handle when Category B is appropriate', () => {
          furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
          furtherChargesPage.selectFurtherChargesRadioButton('YES')
          furtherChargesPage.selectFurtherChargesCategoryBAppropriateRadioButton('YES')
          furtherChargesPage.setFurtherChargesCategoryBAppropriateText('There are further charges')

          furtherChargesPage.saveAndReturnButton().click()

          cy.contains('Automatically referred to Security').should('be.visible')
          taskListPage.furtherChargesLink().click()

          furtherChargesPage.validateFurtherChargesRadioButton({
            selection: ['YES'],
            isChecked: true,
          })

          furtherChargesPage.validateFurtherChargesCategoryBAppropriateRadioButton({
            selection: ['YES'],
            isChecked: true,
          })

          furtherChargesPage.validateFurtherChargesCategoryBAppropriateTextBox({
            isVisible: true,
            expectedText: 'There are further charges',
          })

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].status).to.eq(Status.SECURITY_AUTO.name)
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: {
                furtherCharges: {
                  furtherCharges: 'Yes',
                  furtherChargesCatB: 'Yes',
                  furtherChargesText: 'There are further charges',
                },
              },
            })
          })
        })

        it('should handle when Category B is not appropriate', () => {
          furtherChargesPage = FurtherChargesPage.createForBookingId(bookingId)
          furtherChargesPage.selectFurtherChargesRadioButton('YES')
          furtherChargesPage.selectFurtherChargesCategoryBAppropriateRadioButton('NO')
          furtherChargesPage.setFurtherChargesCategoryBAppropriateText('There are further charges')

          furtherChargesPage.saveAndReturnButton().click()
          cy.contains('Automatically referred to Security').should('be.visible')
          taskListPage.furtherChargesLink().click()

          furtherChargesPage.validateFurtherChargesRadioButton({
            selection: ['YES'],
            isChecked: true,
          })

          furtherChargesPage.validateFurtherChargesCategoryBAppropriateRadioButton({
            selection: ['NO'],
            isChecked: true,
          })

          furtherChargesPage.validateFurtherChargesCategoryBAppropriateTextBox({
            isVisible: true,
            expectedText: 'There are further charges',
          })

          cy.task('selectFormTableDbRow', { bookingId }).then((result: { rows: FormDbJson[] }) => {
            expect(result.rows[0].status).to.eq(Status.SECURITY_AUTO.name)
            expect(result.rows[0].form_response).to.deep.eq({
              ratings: {
                furtherCharges: {
                  furtherCharges: 'Yes',
                  furtherChargesCatB: 'No',
                  furtherChargesText: 'There are further charges',
                },
              },
            })
          })
        })
      })
    })
  })
})
