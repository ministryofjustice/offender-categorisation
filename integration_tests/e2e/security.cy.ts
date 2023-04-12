import Page from '../pages/page'
import { SECURITY_USER } from '../factory/user'
import SecurityHomePage from '../pages/security/home'
import SecurityDonePage from '../pages/security/done'
import SecurityViewPage from '../pages/security/view'
import SecurityUpcomingPage from '../pages/security/upcoming'
import moment from 'moment'

context('Security', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
  })

  beforeEach(() => {
    cy.task('createSecurityReviewedData', {
      id: -2,
      bookingId: 13,
      offenderNo: 'B2345XY',
      status: 'SECURITY_BACK',
      sequenceNumber: 1,
      prisonId: 'LEI',
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
      catType: 'RECAT',
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

    cy.task('createSecurityReviewedData', {
      id: -1,
      bookingId: 14,
      offenderNo: 'B2345YZ',
      status: 'APPROVED',
      sequenceNumber: 1,
      prisonId: 'LEI',
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
      catType: 'INITIAL',
      assignedUserId: 'CATEGORISER_USER',
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubUncategorised')
    cy.task('stubGetMyDetails', { user: SECURITY_USER, caseloadId: 'LEI' })
    cy.task('stubGetMyCaseloads')
    cy.task('stubGetUserDetails', { user: SECURITY_USER, caseloadId: 'LEI' })

    cy.task('stubCategorised', { bookingIds: [11, 12] })
    cy.task('stubGetOffenderDetailsByOffenderNoList', { offenderNumbers: ['B2345XY', 'B2345YZ'] })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SECURITY_USER.username] })
  })

  describe(`'To do' Page`, () => {
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

    it(`should display a table containing the expected prisoner categorisation data`, () => {
      ;[
        { columnName: 'Name', expectedValues: ['Dent, Jane', 'Clark, Frank'] },
        { columnName: 'Prison no.', expectedValues: ['B2345YZ', 'B2345XY'] },
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

    const setupPrisonerViewTests = (config: { bookingId: number }) => {
      const { bookingId } = config

      cy.task('stubGetOffenderDetailsBasicInfo', config)
      cy.task('stubGetOffenderDetailsMainOffence', config)
      cy.task('stubGetOffenderDetailsSentenceDetail', config)
      cy.task('stubGetOffenderDetailsSentenceTerms', config)

      securityDonePage.viewOffenderDetails(bookingId)

      const securityViewPage = Page.verifyOnPage(SecurityViewPage)
      securityViewPage.checkPageUrl(new RegExp(`/form/security/view/${bookingId}$`))
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
      cy.task('createSecurityData', {
        offenderNumber: 'B2345XY',
        prisonId: 'LEI',
        id: 1,
        status: 'NEW',
      })
      cy.task('createSecurityData', {
        offenderNumber: 'B2345YZ',
        prisonId: 'LEI',
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
        startDates: [sentenceStartDates['B2345XY'], sentenceStartDates['B2345YZ']],
      })

      cy.signIn()

      const securityHomePage = Page.verifyOnPage(SecurityHomePage)
      securityHomePage.upcomingTabLink().click()

      securityUpcomingPage = Page.verifyOnPage(SecurityUpcomingPage)
    })

    it(`should display a table containing the expected upcoming categorisation referrals`, () => {
      ;[
        { columnName: 'Name', expectedValues: ['Clark, Frank', 'Dent, Jane'] },
        { columnName: 'Prison no.', expectedValues: ['B2345XY', 'B2345YZ'] },
        {
          columnName: 'Days since sentence',
          expectedValues: ['B2345XY', 'B2345YZ'].map(offenderNo =>
            moment().diff(sentenceStartDates[offenderNo], 'days').toString()
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
