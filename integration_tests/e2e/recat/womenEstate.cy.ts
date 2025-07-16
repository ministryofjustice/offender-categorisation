import RecategoriserHomePage from '../../pages/recategoriser/home'
import moment from 'moment'
import { FEMALE_RECAT_USER, FEMALE_SECURITY_USER } from '../../factory/user'
import Page from '../../pages/page'
import TasklistRecatPage from '../../pages/tasklistRecat/tasklistRecat'
import { CASELOAD } from '../../factory/caseload'
import RecategoriserSecurityInputPage from '../../pages/form/recat/security/recategoriserSecurityInputPage'
import { FormDbJson } from '../../fixtures/db-key-convertor'
import Status from '../../../server/utils/statusEnum'
import CatType from '../../../server/utils/catTypeEnum'
import SecurityHomePage from '../../pages/security/home'
import SecurityReviewPage from '../../pages/form/security/review'
import OpenConditionsAdded from '../../pages/openConditionsAdded'
import EarliestReleaseDatePage from '../../pages/form/openConditions/earliestReleaseDate'

describe("Women's estate recategorisation", () => {
  let recategoriserHomePage: RecategoriserHomePage
  let taskListPage: TasklistRecatPage
  const testBookingId = 12
  const testOffenderNumber = 'G6707GT'
  const nextReviewDate = moment().subtract(4, 'days').format('yyyy-MM-DD')

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('deleteRowsFromSecurityReferral')
    cy.task('reset')
    cy.task('setUpDb')

    const recat = {
      offenderNo: testOffenderNumber,
      bookingId: testBookingId,
      firstName: 'DUFEATHOPHE',
      lastName: 'BETHID',
      assessStatus: 'A',
      category: 'R',
      nextReviewDate: nextReviewDate,
      dateOfBirth: '1990-01-01',
    }

    cy.task('stubRecategorise', { agencyId: CASELOAD.PFI.id, recategorisations: [recat] })
    cy.task('stubGetPrisonerSearchPrisoners', { agencyId: CASELOAD.PFI.id, content: [recat] })
    cy.task('stubSentenceData', {
      offenderNumbers: [testOffenderNumber],
      bookingIds: [testBookingId],
      startDates: [moment('2019-01-28').format('yyyy-MM-dd')],
    })
    cy.task('stubAssessments', { offenderNumber: testOffenderNumber })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: testOffenderNumber, formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: testOffenderNumber })
    cy.task('stubGetOffenderDetailsWomen', {
      bookingId: testBookingId,
      offenderNo: testOffenderNumber,
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubGetSocProfile', {
      offenderNo: testOffenderNumber,
      category: 'T',
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: testOffenderNumber,
      category: 'T',
      increasedRisk: false,
      notifyRegionalCTLead: false,
    })
    cy.task('stubGetEscapeProfile', {
      offenderNo: testOffenderNumber,
      alertCode: 'ABC',
    })
    cy.task('stubGetViolenceProfile', {
      offenderNo: testOffenderNumber,
      category: 'T',
      veryHighRiskViolentOffender: false,
      notifySafetyCustodyLead: false,
      displayAssaults: false,
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
  })

  const checkPrisonerHeaderSummary = () => {
    cy.get('#offenderDisplayName').contains('Hillmob, William')
    cy.get('#offenderNo').contains(testOffenderNumber)
    cy.get('#dob').contains('17/02/1970')
    cy.get('#category').contains('Closed')
  }

  it('starts a recat from the landing page', () => {
    cy.stubLogin({
      user: FEMALE_RECAT_USER,
    })
    cy.signIn()

    recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)
    recategoriserHomePage.selectPrisonerWithBookingId(testBookingId)

    taskListPage = TasklistRecatPage.createForBookingId(testBookingId)
    taskListPage.prisonerBackgroundButton().click()

    cy.get('#extremismInfo').contains(
      'This person is not currently considered to be at risk of engaging in, or vulnerable to, extremism.',
    )
    cy.get('#violenceInfo').contains(
      'This person has not been reported as the perpetrator in any assaults in custody before.',
    )
    cy.get('#escapeInfo').contains('This person is not on the E-List and does not have an Escape Risk Alert.')
    checkPrisonerHeaderSummary()
    cy.get('#offenceDetails').type('offenceDetails text')
    cy.get('button[type="submit"]').contains('Save and return').click()

    taskListPage.oasysInputButton().click()
    checkPrisonerHeaderSummary()
    cy.get('#reviewDate').type('17/6/2020')
    cy.get('#oasysRelevantInfo-2').click()
    cy.get('button[type="submit"]').contains('Save and return').click()

    taskListPage.securityButton().click()
    const recategoriserSecurityInputPage = RecategoriserSecurityInputPage.createForBookingId(testBookingId)
    recategoriserSecurityInputPage.validateSecurityIsRequired()
    recategoriserSecurityInputPage.selectSecurityInputRadioButton('NO')
    recategoriserSecurityInputPage.submitButton().click()

    taskListPage.securityButton().should('be.disabled')
    cy.task('selectFormTableDbRow', { bookingId: testBookingId }).then((result: { rows: FormDbJson[] }) => {
      expect(result.rows[0].cat_type).to.eq(CatType.RECAT.name)
      expect(result.rows[0].status).to.eq(Status.SECURITY_MANUAL.name)
      expect(result.rows[0].referred_by).to.eq(FEMALE_RECAT_USER.username)
      expect(result.rows[0].referred_date).to.contains(moment().format('YYYY-MM-DD'))
      expect(result.rows[0].form_response.recat.securityInput).to.deep.eq({
        securityInputNeeded: 'Yes',
        securityNoteNeeded: 'No',
      })
    })
    taskListPage.validateSecurityReferralDate(new Date())

    cy.task('stubSubmitSecurityReview', { bookingId: testBookingId })
    cy.task('stubGetStaffDetailsByUsernameList', {
      usernames: [FEMALE_RECAT_USER.username, FEMALE_SECURITY_USER.username],
    })
    cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: [testOffenderNumber] })

    cy.stubLogin({
      user: FEMALE_SECURITY_USER,
    })
    cy.signIn()

    const securityHomePage = Page.verifyOnPage(SecurityHomePage)
    securityHomePage.validateCategorisationReferralsToDoTableColumnData([
      {
        columnName: 'Name and prison number',
        expectedValues: ['Clark, Frank' + testOffenderNumber],
      },
      {
        columnName: 'Referred by',
        expectedValues: ['Firstname_female_recat_user Lastname_female_recat_user'],
      },
      {
        columnName: 'Type',
        expectedValues: ['Recat'],
      },
    ])
    securityHomePage.getStartButton({ bookingId: testBookingId }).click()

    const securityReviewPage = SecurityReviewPage.createForBookingId(testBookingId)
    securityReviewPage.validateHeaderRecatNote({ isVisible: true, expectedText: 'Note from categoriser' })
    const testSecurityText = 'Some security input text'
    securityReviewPage.validateNoParagraphRecatNote()
    securityReviewPage.setSecurityInformationText(testSecurityText)
    cy.task('updateFormRecord', {
      bookingId: testBookingId,
      status: Status.SECURITY_BACK.name,
      formResponse: { security: { review: { securityReview: testSecurityText } } },
    })
    securityReviewPage.saveAndSubmitButton().click()

    securityHomePage.validateNoReferralsToReview()

    cy.stubLogin({
      user: FEMALE_RECAT_USER,
    })
    cy.signIn()
    recategoriserHomePage.selectPrisonerWithBookingId(testBookingId, 'Edit')
    taskListPage.validateSecurityCompletedDate(new Date())

    taskListPage.riskAssessmentButton().click()
    checkPrisonerHeaderSummary()
    cy.get('#lowerCategory').type('lower category text')
    cy.get('#higherCategory').type('higher category text')
    cy.get('#otherRelevant-2').click()
    cy.get('button[type="submit"]').contains('Save and return').click()

    taskListPage.decisionButton().click()
    checkPrisonerHeaderSummary()
    cy.get('#openOption').click()
    cy.get('#justification').type('justification text')
    cy.get('button[type="submit"]').contains('Save and return').click()
    const openConditionsAddedPage = Page.verifyOnPage(OpenConditionsAdded)
    openConditionsAddedPage.returnToRecatTasklistButton(testBookingId).click()

    taskListPage.openConditionsButton().click()

    EarliestReleaseDatePage.createForBookingId(testBookingId)
    cy.visit(`/tasklistRecat/${testBookingId}`)

    taskListPage.decisionButton().click()
    cy.get('#closedOption').click()
    cy.get('#justification').type('justification text')
    cy.get('button[type="submit"]').contains('Save and return').click()

    taskListPage.nextReviewDateButton().click()
    checkPrisonerHeaderSummary()
    cy.get('#nextDateChoice').click()
    cy.get('button[type="submit"]').contains('Continue').click()
    cy.get('#reviewDate').should('have.value', moment().add(6, 'months').format('D/M/YYYY'))
    cy.get('button[type="submit"]').contains('Save and return').click()

    taskListPage.validateSummarySection()
    cy.get(`a[href="/form/recat/review/${testBookingId}"]`).contains('Continue').click()

    cy.get('.securityInputSummary').within(() => {
      cy.contains('Automatic referral to security team')
        .parent()
        .within(() => {
          cy.contains('No')
        })
      cy.contains('Manual referral to security team')
        .parent()
        .within(() => {
          cy.contains('Yes')
        })
      cy.contains('Flagged by security team')
        .parent()
        .within(() => {
          cy.contains('No')
        })
      cy.contains('Security comments')
        .parent()
        .within(() => {
          cy.contains(testSecurityText)
        })
    })
    cy.get('.riskAssessmentSummary').within(() => {
      cy.contains('Could they be managed in a lower security category?')
        .parent()
        .within(() => {
          cy.contains('lower category text')
        })
      cy.contains('Should they remain in their current security category? Or be put in a higher security category?')
        .parent()
        .within(() => {
          cy.contains('higher category text')
        })
      cy.contains('Other relevant information')
        .parent()
        .within(() => {
          cy.contains('No')
        })
    })
    cy.get('.assessmentSummary').within(() => {
      cy.contains('What security category is most suitable for this person?')
        .parent()
        .within(() => {
          cy.contains('Closed')
        })
    })
    cy.get('.nextReviewDateSummary').within(() => {
      cy.contains('What date should they be reviewed by?')
        .parent()
        .within(() => {
          cy.contains(moment().add(6, 'months').format('dddd D MMMM YYYY'))
        })
    })
    cy.task('stubCategorise', {
      expectedCat: 'R',
      nextReviewDate: moment().add(6, 'months').format('YYYY-MM-DD'),
    })
    cy.get('button[type="submit"]').contains('Save and submit').click()
    cy.get('h1').contains('Submitted for approval')
  })
})
