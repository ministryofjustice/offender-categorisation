import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'
import { SUPERVISOR_USER } from '../../factory/user'
import Page from '../../pages/page'
import RecatApprovedViewPage from '../../pages/form/recatApprovedView'
import SupervisorHomePage from '../../pages/supervisor/home'
import SupervisorDonePage from '../../pages/supervisor/done'
import ApprovedViewPage from '../../pages/form/approvedView'

describe('Approved View', () => {
  let sentenceStartDates: Record<'B2345XY' | 'B2345YZ', Date>
  let recatApprovedViewPage: RecatApprovedViewPage
  let today: Date

  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')

    sentenceStartDates = {
      B2345XY: new Date('2019-01-28'),
      B2345YZ: new Date('2019-01-31'),
    }

    today = new Date()
  })

  it('The approved view page is correctly displayed (suggested Cat)', () => {
    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId: 11,
      nomisSequenceNumber: 8,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
      review_reason: 'AGE'
    })

    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 7,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345YZ',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'C' },
          oasysInput: { date: '14/12/2019', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2019' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
          supervisor: { review: { supervisorCategoryAppropriate: 'Yes' } },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
      review_reason: 'AGE'
    })

    cy.task('updateRiskProfile', {
      bookingId: 12,
      riskProfile: {
      "socProfile": {"nomsId": "B2345YZ", "riskType": "SOC", "transferToSecurity": false},
      "escapeProfile": {"nomsId": "B2345YZ", "riskType": "ESCAPE", "activeEscapeList": true, "activeEscapeRisk": true,
      "escapeListAlerts" : [ { "active": true, "comment": "First xel comment", "expired": true, "alertCode": "XEL", "dateCreated": "2016-09-14", "alertCodeDescription": "Escape List"}]
    },
      "violenceProfile": {"nomsId": "B2345YZ", "riskType": "VIOLENCE", "displayAssaults": true, "numberOfAssaults": 5, "notifySafetyCustodyLead": true, "numberOfSeriousAssaults": 2, "numberOfNonSeriousAssaults": 3, "provisionalCategorisation": "C", "veryHighRiskViolentOffender": false},
      "extremismProfile": {"nomsId": "B2345YZ", "riskType": "EXTREMISM", "notifyRegionalCTLead": true, "increasedRiskOfExtremism": true, "provisionalCategorisation": "C"}}
    })

    cy.task('stubUncategorisedAwaitingApproval')
    cy.task('stubCategorised', {
      bookingIds: [12],
    })
    cy.task('stubAgencyDetails', { agency: 'LEI' })
    cy.task('stubGetStaffDetailsByUsernameList', { usernames: [SUPERVISOR_USER.username] })
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
      offenderNo: 'B2345YZ',
      youngOffender: false,
      indeterminateSentence: false,
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubAgencyDetails', { agency: 'LPI' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })

    cy.stubLogin({
      user: SUPERVISOR_USER,
    })
    cy.signIn()

    const supervisorHomePage = Page.verifyOnPage(SupervisorHomePage)
    supervisorHomePage.doneTabLink().click()

    const supervisorDonePage = Page.verifyOnPage(SupervisorDonePage)
    supervisorDonePage.viewApprovedPrisonerButton({ bookingId: 12}).click()

    recatApprovedViewPage = Page.verifyOnPage(RecatApprovedViewPage)

    const approvedViewRecatPage = Page.verifyOnPage(RecatApprovedViewPage)
    approvedViewRecatPage.validateCategorisationWarnings([
      'Category C',
      'The categoriser recommends Category C',
      'The supervisor also recommends Category C',
    ]);

    [
      {
        columnName: 'Categorisation date',
        expectedValues: ['24/03/2013', '08/06/2012'],
      },
      {
        columnName: 'Category decision',
        expectedValues: ['B', 'A'],
      },
      {
        columnName: 'Review location',
        expectedValues: ['LPI prison', 'LPI prison'],
      }
      ].forEach(cy.checkTableColumnTextValues)

    approvedViewRecatPage.validatePrisonerSummary('This person has been reported as the perpetrator in 5 assaults in custody before, including 2 serious assaults and 3 non-serious assaults in the past 12 months. You should consider the dates and context of these assaults in your assessment.')
    approvedViewRecatPage.validatePrisonerSummary('This person is considered an escape risk E-List: First xel comment 2016-09-14 (expired)')
    approvedViewRecatPage.validatePrisonerSummary('This person is at risk of engaging in, or vulnerable to, extremism.')
  })
})