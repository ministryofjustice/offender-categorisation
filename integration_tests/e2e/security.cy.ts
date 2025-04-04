import moment from 'moment'
import Page from '../pages/page'
import { CATEGORISER_USER, SECURITY_USER } from '../factory/user'
import SecurityHomePage from '../pages/security/home'
import SecurityDonePage from '../pages/security/done'
import SecurityViewPage from '../pages/security/view'
import SecurityUpcomingPage from '../pages/security/upcoming'
import { CASELOAD } from '../factory/caseload'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import STATUS from '../../server/utils/statusEnum'
import { AGENCY_LOCATION } from '../factory/agencyLocation'

context('Security', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  beforeEach(() => {
    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId: 13,
      offenderNo: 'B2345XY',
      status: STATUS.SECURITY_BACK.name,
      sequenceNumber: 1,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        ratings: {
          offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
          violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'Yes' },
          escapeRating: { escapeFurtherCharges: 'Yes' },
          extremismRating: { previousTerrorismOffences: 'Yes' },
        },
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'C',
            overriddenCategory: 'D',
            categoryAppropriate: 'No',
            overriddenCategoryText: 'over ridden category text',
          },
        },
        security: { review: { securityReview: 'this is the text from the security team for a recat' } },
      },
      securityReviewedBy: SECURITY_USER.username,
      securityReviewedDate: '2019-01-28',
      catType: CATEGORISATION_TYPE.RECAT,
      assignedUserId: 'CATEGORISER_USER',
    })

    cy.task('updateRiskProfile', {
      bookingId: 13,
      riskProfile: {
        socProfile: {
          nomsId: 'G1110GX',
          riskType: 'SOC',
          transferToSecurity: true,
          provisionalCategorisation: 'C',
        },
      },
    })

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 14,
      offenderNo: 'B2345YZ',
      status: STATUS.APPROVED.name,
      sequenceNumber: 1,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        ratings: {
          offendingHistory: { previousConvictions: 'Yes', previousConvictionsText: 'some convictions' },
          securityInput: { securityInputNeeded: 'Yes', securityInputNeededText: 'Comments from Categoriser' },
          violenceRating: { highRiskOfViolence: 'No', seriousThreat: 'Yes' },
          escapeRating: { escapeFurtherCharges: 'Yes' },
          extremismRating: { previousTerrorismOffences: 'Yes' },
        },
        categoriser: {
          provisionalCategory: {
            suggestedCategory: 'C',
            overriddenCategory: 'D',
            categoryAppropriate: 'No',
            overriddenCategoryText: 'over ridden category text',
          },
        },
        security: { review: { securityReview: 'this is the text from the security team' } },
      },
      securityReviewedBy: SECURITY_USER.username,
      securityReviewedDate: '2019-01-31',
      catType: CATEGORISATION_TYPE.INITIAL,
      assignedUserId: 'CATEGORISER_USER',
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubUncategorised')
    cy.task('stubGetMyDetails', { user: SECURITY_USER, caseloadId: 'LEI' })
    cy.task('stubGetMyCaseloads', { caseloads: [CASELOAD.LEI] })
    cy.task('stubGetUserDetails', { user: SECURITY_USER, caseloadId: 'LEI' })

    cy.task('stubCategorised', { bookingIds: [11, 12] })
    cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345XY', 'B2345YZ'] })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SECURITY_USER.username] })
  })

  beforeEach(() => {
    cy.stubLogin({
      user: SECURITY_USER,
    })
  })

  describe(`'To do' Page`, () => {
    it('should be inaccessible to users without ROLE_CATEGORISATION_SECURITY', () => {
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()
      cy.request({
        url: SecurityHomePage.baseUrl,
        failOnStatusCode: false,
      }).then(resp => {
        expect(resp.status).to.eq(403)
      })
    })

    it('should display by default', () => {
      cy.signIn()
      Page.verifyOnPage(SecurityHomePage)
    })
  })

  describe(`'Done' page`, () => {
    let securityDonePage: SecurityDonePage

    beforeEach(() => {
      cy.signIn()

      const securityHomePage = Page.verifyOnPage(SecurityHomePage)
      securityHomePage.doneTabLink().click()

      securityDonePage = Page.verifyOnPage(SecurityDonePage)
    })

    it('should be inaccessible to users without ROLE_CATEGORISATION_SECURITY', () => {
      securityDonePage.signOut().click()
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()
      cy.request({
        url: SecurityDonePage.baseUrl,
        failOnStatusCode: false,
      }).then(resp => {
        expect(resp.status).to.eq(403)
      })
    })

    it(`should display a table containing the expected prisoner categorisation data`, () => {
      ;[
        { columnName: 'Name and prison number', expectedValues: ['Dent, JaneB2345YZ', 'Clark, FrankB2345XY'] },
        { columnName: 'Date reviewed', expectedValues: ['31/01/2019', '28/01/2019'] },
        {
          columnName: 'Reviewed by',
          expectedValues: [
            'Lastname_security_user, Firstname_security_user',
            'Lastname_security_user, Firstname_security_user',
          ],
        },
        { columnName: 'Type', expectedValues: ['Initial', 'Recat'] },
      ].forEach(cy.checkTableColumnTextValues)
    })

    const setupPrisonerViewTests = ({ bookingId }: { bookingId: number }) => {
      cy.task('stubGetOffenderDetails', { bookingId })

      securityDonePage.viewOffenderDetails(bookingId)

      const securityViewPage = Page.verifyOnPage(SecurityViewPage)
      securityViewPage.checkPageUrl(`/form/security/view/${bookingId}`)
    }

    it('should allow viewing an initial categorisation prisoner', () => {
      setupPrisonerViewTests({ bookingId: 14 })
      ;[
        { term: 'Referral type', definition: 'Manual' },
        { term: 'Categoriser comments', definition: 'Comments from Categoriser' },
        { term: 'Security comments', definition: 'this is the text from the security team' },
      ].forEach(cy.checkDefinitionList)
    })

    it('should allow viewing a recategorisation prisoner', () => {
      setupPrisonerViewTests({ bookingId: 13 })
      ;[
        { term: 'Referral type', definition: 'Automatic' },
        { term: 'Security comments', definition: 'this is the text from the security team for a recat' },
      ].forEach(cy.checkDefinitionList)
    })
  })

  describe(`'Upcoming' page`, () => {
    let securityUpcomingPage: SecurityUpcomingPage
    let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>

    beforeEach(() => {
      cy.task('insertSecurityReferralTableDbRow', {
        offenderNumber: 'B2345XY',
        prisonId: AGENCY_LOCATION.LEI.id,
        id: 1,
        status: 'NEW',
      })
      cy.task('insertSecurityReferralTableDbRow', {
        offenderNumber: 'B2345YZ',
        prisonId: AGENCY_LOCATION.LEI.id,
        id: 2,
        status: 'NEW',
      })

      sentenceStartDates = {
        B2345XY: new Date('2019-01-28'),
        B2345YZ: new Date('2019-01-31'),
      }

      cy.task('stubSentenceData', {
        offenderNumbers: ['B2345XY', 'B2345YZ'],
        bookingIds: [13, 14],
        startDates: [sentenceStartDates.B2345XY, sentenceStartDates.B2345YZ],
      })

      cy.signIn()

      const securityHomePage = Page.verifyOnPage(SecurityHomePage)
      securityHomePage.upcomingTabLink().click()

      securityUpcomingPage = Page.verifyOnPage(SecurityUpcomingPage)
    })

    it('should be inaccessible to users without ROLE_CATEGORISATION_SECURITY', () => {
      securityUpcomingPage.signOut().click()
      cy.stubLogin({
        user: CATEGORISER_USER,
      })
      cy.signIn()
      cy.request({
        url: SecurityDonePage.baseUrl,
        failOnStatusCode: false,
      }).then(resp => {
        expect(resp.status).to.eq(403)
      })
    })

    it(`should display a table containing the expected upcoming categorisation referrals`, () => {
      ;[
        { columnName: 'Name and prison number', expectedValues: ['Clark, FrankB2345XY', 'Dent, JaneB2345YZ'] },
        {
          columnName: 'Days since sentence',
          expectedValues: ['B2345XY', 'B2345YZ'].map(offenderNo =>
            moment().diff(sentenceStartDates[offenderNo], 'days').toString(),
          ),
        },
        {
          columnName: 'Referred by',
          expectedValues: [
            'Lastname_security_user, Firstname_security_user',
            'Lastname_security_user, Firstname_security_user',
          ],
        },
      ].forEach(cy.checkTableColumnTextValues)
    })
  })
})
