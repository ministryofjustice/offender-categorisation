import moment from 'moment'
import SecurityLandingPage from '../../pages/security/landing'
import { CATEGORISER_USER, RECATEGORISER_USER, SECURITY_USER } from '../../factory/user'
import { SecurityReferralDbRow } from '../../db/queries'
import Page from '../../pages/page'
import RecategoriserHomePage from '../../pages/recategoriser/home'
import SecurityHomePage from '../../pages/security/home'
import SecurityReviewPage from '../../pages/form/security/review'

describe('Security Landing', () => {
  const testBookingId = 12
  const testOffenderNumber = 'B2345YZ'

  beforeEach(() => {
    cy.task('deleteRowsFromForm')
    cy.task('deleteRowsFromSecurityReferral')
    cy.task('reset')
    cy.task('setUpDb')

    cy.task('getOffenderStub', { offenderNumber: testOffenderNumber })
    cy.task('stubSentenceData', {
      offenderNumbers: [testOffenderNumber],
      bookingIds: [testBookingId],
      startDates: [moment('2019-01-28').format('yyyy-MM-dd')],
    })
    cy.task('stubGetOffenderDetails', {
      bookingId: testBookingId,
      offenderNo: testOffenderNumber,
      youngOffender: false,
      indeterminateSentence: false,
    })
  })
  it('should allow a security user to flag a prisoner for later referral then cancel the referral', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.visit(`securityLanding/${testBookingId}`)
    let securityLandingPage = SecurityLandingPage.createForBookingId(testBookingId)
    securityLandingPage.verifyPageHeading('Refer this person to security at next category review')
    securityLandingPage.referButton().click()
    cy.task('getSecurityReferral', { offenderNumber: testOffenderNumber }).then(
      (result: { rows: SecurityReferralDbRow[] }) => {
        const record = result.rows[0]

        expect(record?.offender_no).eq(testOffenderNumber)
        expect(record?.status).eq('NEW')
        expect(record?.prison_id).eq('LEI')
        expect(record?.user_id).eq(SECURITY_USER.username)
        expect(moment(record?.raised_date).valueOf() - moment.now().valueOf()).lt(10000)
      },
    )

    cy.visit(`securityLanding/${testBookingId}`)
    securityLandingPage.verifyPageHeading(
      'This person will automatically be referred to security at the next category review.',
    )
    cy.contains(`Referred by Another User of LEEDS (HMP) on ${moment().format('DD/MM/YYYY')}.`)
    securityLandingPage.cancelButton().click()
    cy.get('h1').contains('Confirm cancellation')
    cy.get('h2').contains('Are you sure you want to cancel this referral?')
    cy.get('[data-qa="submit-cancel-referral"]').contains('Submit').click()
    securityLandingPage.errorSummaries().contains('Please select yes or no')
    securityLandingPage.errors().contains('Please select yes or no')
    cy.get(`[data-qa="cancel-referral-no"]`).click()
    cy.get(`[data-qa="submit-cancel-referral"]`).click()
    cy.task('getSecurityReferral', { offenderNumber: testOffenderNumber }).then(
      (result: { rows: SecurityReferralDbRow[] }) => {
        const record = result.rows[0]
        expect(record?.status).eq('NEW')
      },
    )
    securityLandingPage.cancelButton().click()
    cy.get(`[data-qa="cancel-referral-yes"]`).click()
    cy.get(`[data-qa="submit-cancel-referral"]`).click()
    cy.get('h1').contains('Cancellation confirmed')
    cy.task('getSecurityReferral', { offenderNumber: testOffenderNumber }).then(
      (result: { rows: SecurityReferralDbRow[] }) => {
        const record = result.rows[0]
        expect(record?.status).eq('CANCELLED')
      },
    )
  })
  it('should automatically refer to security when security user has referred before a recat started', () => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
    cy.signIn()
    cy.visit(`securityLanding/${testBookingId}`)
    SecurityLandingPage.createForBookingId(testBookingId).referButton().click()

    const recat = {
      offenderNo: testOffenderNumber,
      bookingId: testBookingId,
      firstName: 'DUFEATHOPHE',
      lastName: 'BETHID',
      assessmentDate: '2024-04-22',
      assessmentSeq: 18,
      category: 'C',
      nextReviewDate: '2025-01-01',
    }
    cy.task('stubRecategorise', { recategorisations: [recat], latestOnly: [], agencyId: 'LEI' })
    cy.task('stubGetPrisonerSearchPrisoners', {
      agencyId: 'LEI',
      content: [recat],
    })

    cy.stubLogin({
      user: RECATEGORISER_USER,
    })
    cy.signIn()
    const recategoriserHomePage = Page.verifyOnPage(RecategoriserHomePage)

    cy.task('stubGetOcgmAlert', {
      offenderNo: testOffenderNumber,
      transferToSecurity: false,
    })
    cy.task('stubGetExtremismProfile', {
      offenderNo: testOffenderNumber,
      band: 4,
    })

    recategoriserHomePage.selectPrisonerWithBookingId(testBookingId)
    cy.contains(`Flagged to be referred to Security (${moment().format('DD/MM/YYYY')})`)

    cy.task('getSecurityReferral', { offenderNumber: testOffenderNumber }).then(
      (result: { rows: SecurityReferralDbRow[] }) => {
        const record = result.rows[0]
        expect(record?.status).eq('REFERRED')
      },
    )

    cy.task('stubGetStaffDetailsByUsernameList', {
      usernames: [CATEGORISER_USER.username, SECURITY_USER.username],
    })
    cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: [testOffenderNumber] })

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
        expectedValues: ['Firstname_security_user Lastname_security_user'],
      },
    ])
    securityHomePage.getStartButton({ bookingId: testBookingId }).click()
    const securityReviewPage = SecurityReviewPage.createForBookingId(testBookingId)
    cy.get('#p-flagged').contains('Flagged for review')
    securityReviewPage.setSecurityInformationText('security info text')
    cy.task('updateFormRecord', {
      testBookingId,
      formResponse: { security: { review: { securityReview: 'Test security info text' } } },
    })
    cy.task('stubSubmitSecurityReview', { bookingId: testBookingId })
    securityReviewPage.saveButton().click()
  })
})
