import moment from 'moment'
import { RECATEGORISER_USER, SUPERVISOR_USER } from '../../factory/user'
import { CATEGORISATION_TYPE } from '../../support/categorisationType'
import { AGENCY_LOCATION } from '../../factory/agencyLocation'
import STATUS from '../../../server/utils/statusEnum'

import RecategoriserHomePage from '../../pages/recategoriser/home'
import Page from '../../pages/page'
import RecatAwaitingApprovalPage from '../../pages/recatAwaitingSupervisorApproval/awaitingApprovalView'
import CancelPage from '../../pages/cancel/cancel'
import CancelConfirmedPage from '../../pages/cancel/cancelConfirmed'

describe('Cancel recategorisation', () => {
  const bookingId = 12
  let today: Date

  beforeEach(() => {
    today = new Date()

    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')

    // new recat
    cy.task('insertFormTableDbRow', {
      id: -2,
      bookingId: 12,
      nomisSequenceNumber: 6,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345XY',
      sequenceNumber: 1,
      status: STATUS.APPROVED.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date('2023-01-01'),
      formResponse: {
        recat: {
          decision: { category: 'C', justification: 'approved recat' },
          oasysInput: { date: '14/12/2024', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'No', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2038' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: SUPERVISOR_USER.username,
      review_reason: 'DUE',
    })

    // historic recat
    cy.task('insertFormTableDbRow', {
      id: -1,
      bookingId: 12,
      nomisSequenceNumber: 7,
      catType: CATEGORISATION_TYPE.RECAT,
      offenderNo: 'B2345XY',
      sequenceNumber: 2,
      status: STATUS.AWAITING_APPROVAL.name,
      prisonId: AGENCY_LOCATION.LEI.id,
      startDate: new Date(),
      formResponse: {
        recat: {
          decision: { category: 'B', justification: 'justification test' },
          oasysInput: { date: '14/12/2025', oasysRelevantInfo: 'No' },
          securityInput: { securityInputNeeded: 'Yes', securityNoteNeeded: 'No' },
          nextReviewDate: { date: '14/12/2039' },
          prisonerBackground: { offenceDetails: 'offence Details text' },
          riskAssessment: {
            lowerCategory: 'lower security category text',
            otherRelevant: 'Yes',
            higherCategory: 'higher security category text',
            otherRelevantText: 'other relevant information',
          },
        },
      },
      securityReviewedBy: null,
      securityReviewedDate: null,
      assignedUserId: null,
      approvedBy: null,
      review_reason: 'DUE',
    })

    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'B',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-dd'),
          assessStatus: 'P',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'D',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-dd'),
          assessStatus: 'A',
        },
      ],
    })

    cy.task('stubGetPrisonerSearchPrisoners')
    cy.task('stubSentenceData', {
      offenderNumbers: ['B2345XY', 'B2345YZ'],
      bookingIds: [11, 12],
      startDates: [today, today],
    })
    cy.task('stubAssessments', { offenderNumber: 'B2345YZ' })
    cy.task('stubSentenceDataGetSingle', { offenderNumber: 'B2345YZ', formattedReleaseDate: '2014-11-23' })
    cy.task('stubOffenceHistory', { offenderNumber: 'B2345YZ' })
    cy.task('stubGetOffenderDetails', {
      bookingId: 12,
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
    cy.task('stubGetViperData', {
      prisonerNumber: 'B2345YZ',
      aboveThreshold: true,
    })
    cy.task('stubGetAssaultIncidents', {
      prisonerNumber: 'B2345YZ',
      assaultIncidents: [],
    })
    cy.task('stubAgencyDetails', { agency: 'LPI' })

    cy.stubLogin({ user: RECATEGORISER_USER })

    cy.signIn()
  })

  it('allows a recategorisation awaiting approval to be viewed and cancelled previously approved record', () => {
    const recatHomePage = Page.verifyOnPage(RecategoriserHomePage)

    recatHomePage.selectPrisonerAwaitingApprovalWithBookingId(bookingId, 'View')

    const recatAwaitingApprovalPage = Page.verifyOnPage(RecatAwaitingApprovalPage)
    recatAwaitingApprovalPage.cancelLink().click()

    const cancelPage = Page.verifyOnPage(CancelPage)
    cancelPage.confirmNo().click()
    cancelPage.submitButton().click()

    recatAwaitingApprovalPage.cancelLink().click()
    cy.task('stubSetInactive', { bookingId: 12, status: 'PENDING' })
    cancelPage.confirmYes().click()
    cancelPage.submitButton().click()

    const today = new Date()
    cy.task('stubRecategorise', {
      recategorisations: [
        {
          bookingId: 12,
          offenderNo: 'B2345XY',
          firstName: 'PENELOPE',
          lastName: 'PITSTOP',
          category: 'B',
          nextReviewDate: moment(today).subtract(4, 'days').format('yyyy-MM-DD'),
          assessStatus: 'A',
        },
        {
          bookingId: 11,
          offenderNo: 'B2345YZ',
          firstName: 'ANT',
          lastName: 'HILLMOB',
          category: 'D',
          nextReviewDate: moment(today).subtract(2, 'days').format('yyyy-MM-DD'),
          assessStatus: 'A',
        },
      ],
    })

    const cancelConfirmedPage = new CancelConfirmedPage()
    cancelConfirmedPage.finishButton().should('be.visible')
    cancelConfirmedPage.finishButton().click()

    // check new recat
    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, data => {
      const dbRecord = data.rows[1]

      expect(dbRecord.status).to.equal('CANCELLED')
      expect(dbRecord.cancelled_by).to.equal('RECATEGORISER_USER')
      expect(dbRecord.cancelled_date).to.not.equal(null)

      return true
    })

    // check historic recat
    cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 12 }, data => {
      const dbRecord = data.rows[0]

      expect(dbRecord.status).to.equal('APPROVED')
      expect(dbRecord.cancelled_by).to.equal(null)
      expect(dbRecord.cancelled_date).to.equal(null)

      return true
    })

    const recatHomePageReloaded = Page.verifyOnPage(RecategoriserHomePage)

    cy.contains('tr', 'B2345XY').within(() => {
      cy.get('td')
        .invoke('text')
        .then(text => {
          const normalised = text.replace(/\s+/g, ' ').trim()
          expect(normalised).to.include('Not started')
          expect(normalised).to.include('Start')
        })
    })
  })
})
