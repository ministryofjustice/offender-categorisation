import { dbSeeder, dbSeederLiteCategory } from '../fixtures/db-seeder'
import mensUnapprovedInitialCategorisationSeedData from '../fixtures/events/mensUnapprovedInitialCategorisationSeedData'
import mensUnapprovedRecategorisationSeedData from '../fixtures/events/mensUnapprovedRecategorisationSeedData'
import mensUnapprovedLiteCategorisationSeedData from '../fixtures/events/mensUnapprovedLiteCategorisationSeedData'
import { AGENCY_LOCATION } from '../factory/agencyLocation'
import STATUS from '../../server/utils/statusEnum'
import { CATEGORISATION_TYPE } from '../support/categorisationType'
import { CATEGORISER_USER } from '../factory/user'
import { LiteCategoryDbRow, RiskChangeDbRow, SecurityReferralDbRow } from '../db/queries'

type DbQueryResult = { rowCount: number; rows: any[] }

describe('Events', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('setUpDb')
    cy.task('deleteRowsFromForm')
  })

  describe('prisoner-offender-search.prisoner.released', () => {
    it('should do nothing with release events when the "reason" is not "RELEASED"', () => {
      dbSeeder(mensUnapprovedInitialCategorisationSeedData())
      cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 10000 }, (data: DbQueryResult) => {
        cy.log('Result: ', data.rowCount)
        return data.rowCount === 12
      })

      cy.task('sendPrisonerReleasedMessage', { nomsNumber: 'B0010XY', reason: 'TRANSFER' }).then(() => {
        cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 10000 }, (data: DbQueryResult) => {
          cy.log('Result: ', data.rowCount)
          return data.rowCount === 12
        })
      })
    })

    it('should delete any unapproved initial categorisations for a given bookingId', () => {
      dbSeeder(mensUnapprovedInitialCategorisationSeedData())
      cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 10000 }, (data: DbQueryResult) => {
        cy.log('Result: ', data.rowCount)
        return data.rowCount === 12
      })

      cy.task('sendPrisonerReleasedMessage', { nomsNumber: 'B0010XY' }).then(() => {
        cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 10000 }, (data: DbQueryResult) => {
          cy.log('Result: ', data.rowCount)
          const expectedRemainingSequenceNumbers = [8, 10, 11, 12]
          const allRemain = data.rows.every(row =>
            expectedRemainingSequenceNumbers.some(seq_no => seq_no === row.sequence_no),
          )
          return data.rowCount === expectedRemainingSequenceNumbers.length && allRemain
        })
      })
    })

    it('should delete any unapproved recategorisations for a given bookingId', () => {
      dbSeeder(mensUnapprovedRecategorisationSeedData())
      cy.assertDBWithRetries(
        'selectFormTableDbRow',
        { bookingId: 20000 },
        (rows: DbQueryResult) => rows.rowCount === 12,
      )

      cy.task('sendPrisonerReleasedMessage', { nomsNumber: 'B0011XY' }).then(() => {
        cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 20000 }, (data: DbQueryResult) => {
          cy.log('Result: ', data.rowCount)
          const expectedRemainingSequenceNumbers = [8, 10, 11, 12]
          const allRemain = data.rows.every(row =>
            expectedRemainingSequenceNumbers.some(seq_no => seq_no === row.sequence_no),
          )
          return data.rowCount === expectedRemainingSequenceNumbers.length && allRemain
        })
      })
    })

    it('should delete any unapproved lite categorisations for a given bookingId', () => {
      dbSeederLiteCategory(mensUnapprovedLiteCategorisationSeedData())
      cy.assertDBWithRetries('getLiteData', { bookingId: 30000 }, (data: DbQueryResult) => {
        cy.log('Result: ', data.rowCount)
        return data.rowCount === 6
      })

      cy.task('sendPrisonerReleasedMessage', { nomsNumber: 'B2345YZ' }).then(() => {
        cy.assertDBWithRetries('getLiteData', { bookingId: 30000 }, (data: DbQueryResult) => {
          cy.log('Result: ', data.rowCount)
          const expectedRemainingSequenceNumbers = [3, 4, 6]
          const allRemain = data.rows.every(row =>
            expectedRemainingSequenceNumbers.some(seq_no => seq_no === row.sequence),
          )
          return data.rowCount === expectedRemainingSequenceNumbers.length && allRemain
        })
      })
    })
  })

  describe('prison transfer events', () => {
    it('should change the prison id in all tables', () => {
      cy.task('insertFormTableDbRow', {
        id: 1,
        bookingId: 123,
        formResponse: '{}',
        userId: 'CATEGORISER_USER',
        status: STATUS.APPROVED.name,
        catType: CATEGORISATION_TYPE.INITIAL,
        assignedUserId: null,
        referredDate: null,
        referredBy: null,
        sequenceNumber: 1,
        riskProfile: null,
        prisonId: AGENCY_LOCATION.LEI.id,
        offenderNo: 'B0010XY',
        startDate: new Date(),
        securityReviewedBy: null,
        securityReviewedDate: null,
      })
      cy.task('insertFormTableDbRow', {
        id: 2,
        bookingId: 123,
        formResponse: '{}',
        userId: 'CATEGORISER_USER',
        status: STATUS.STARTED.name,
        catType: CATEGORISATION_TYPE.INITIAL,
        assignedUserId: null,
        referredDate: null,
        referredBy: null,
        sequenceNumber: 2,
        riskProfile: null,
        prisonId: AGENCY_LOCATION.LEI.id,
        offenderNo: 'B0010XY',
        startDate: new Date(),
        securityReviewedBy: null,
        securityReviewedDate: null,
      })
      cy.task('insertFormTableDbRow', {
        id: 3,
        bookingId: 124,
        formResponse: '{}',
        userId: 'CATEGORISER_USER',
        status: STATUS.STARTED.name,
        catType: CATEGORISATION_TYPE.INITIAL,
        assignedUserId: null,
        referredDate: null,
        referredBy: null,
        sequenceNumber: 1,
        riskProfile: null,
        prisonId: AGENCY_LOCATION.LEI.id,
        offenderNo: 'B0010XY',
        startDate: new Date(),
        securityReviewedBy: null,
        securityReviewedDate: null,
      })
      cy.task('insertFormTableDbRow', {
        id: 4,
        bookingId: 125,
        formResponse: '{}',
        userId: 'CATEGORISER_USER',
        status: STATUS.STARTED.name,
        catType: CATEGORISATION_TYPE.INITIAL,
        assignedUserId: null,
        referredDate: null,
        referredBy: null,
        sequenceNumber: 1,
        riskProfile: null,
        prisonId: AGENCY_LOCATION.LEI.id,
        offenderNo: 'B0010XZ',
        startDate: new Date(),
        securityReviewedBy: null,
        securityReviewedDate: null,
      })
      cy.task('insertLiteCategoryTableDbRow', {
        booking_id: 123,
        sequence: 1,
        offender_no: 'B0010XY',
        category: 'V',
        prison_id: AGENCY_LOCATION.LEI.id,
        created_date: new Date(),
        approved_date: new Date(),
        assessed_by: 'CATEGORISER_USER',
        approved_by: 'SUPERVISOR_USER',
        assessment_committee: 'Committee A',
        assessment_comment: 'Initial assessment comment',
        next_review_date: new Date(),
        placement_prison_id: AGENCY_LOCATION.LEI.id,
        approved_committee: 'Committee B',
        approved_placement_prison_id: AGENCY_LOCATION.LEI.id,
        approved_placement_comment: 'Approved placement comment',
        approved_comment: 'Approved comment',
      })
      cy.task('insertLiteCategoryTableDbRow', {
        booking_id: 123,
        sequence: 2,
        offender_no: 'B0010XY',
        category: 'V',
        prison_id: AGENCY_LOCATION.LEI.id,
        created_date: new Date(),
        approved_date: null,
        assessed_by: 'CATEGORISER_USER',
        approved_by: null,
        assessment_committee: 'Committee A',
        assessment_comment: 'Initial assessment comment',
        next_review_date: new Date(),
        placement_prison_id: AGENCY_LOCATION.LEI.id,
        approved_committee: null,
        approved_placement_prison_id: null,
        approved_placement_comment: null,
        approved_comment: null,
      })
      cy.task('insertLiteCategoryTableDbRow', {
        booking_id: 124,
        sequence: 1,
        offender_no: 'B0010XY',
        category: 'V',
        prison_id: AGENCY_LOCATION.LEI.id,
        created_date: new Date(),
        approved_date: new Date(),
        assessed_by: 'CATEGORISER_USER',
        approved_by: 'SUPERVISOR_USER',
        assessment_committee: 'Committee A',
        assessment_comment: 'Initial assessment comment',
        next_review_date: new Date(),
        placement_prison_id: AGENCY_LOCATION.LEI.id,
        approved_committee: 'Committee B',
        approved_placement_prison_id: AGENCY_LOCATION.LEI.id,
        approved_placement_comment: 'Approved placement comment',
        approved_comment: 'Approved comment',
      })
      cy.task('insertRiskChangeTableDbRow', {
        offenderNumber: 'B0010XY',
        prisonId: AGENCY_LOCATION.LEI.id,
        status: 'PROCESSED',
      })
      cy.task('insertRiskChangeTableDbRow', {
        offenderNumber: 'B0010XY',
        prisonId: AGENCY_LOCATION.LEI.id,
        status: 'NEW',
      })
      cy.task('insertSecurityReferralTableDbRow', {
        offenderNumber: 'B0010XY',
        prisonId: AGENCY_LOCATION.LEI.id,
        id: 1,
        status: 'NEW',
      })
      cy.task('insertSecurityReferralTableDbRow', {
        offenderNumber: 'B0010XZ',
        prisonId: AGENCY_LOCATION.LEI.id,
        id: 2,
        status: 'NEW',
      })
      cy.task('stubGetOffenderDetails', {
        bookingId: 123,
        offenderNo: 'B0010XY',
        youngOffender: false,
        indeterminateSentence: false,
        basicInfo: true,
      })
      cy.stubLogin({
        user: CATEGORISER_USER,
      })

      cy.task('sendPrisonerTransferMessage', { nomsNumber: 'B0010XY', bookingId: 123 }).then(() => {
        cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 123 }, (data: DbQueryResult) => {
          cy.log('Result: ', data.rowCount)
          return (
            data.rows.find(r => r.id === 1).prison_id === AGENCY_LOCATION.LEI.id &&
            data.rows.find(r => r.id === 2).prison_id === AGENCY_LOCATION.BMI.id
          )
        })
        cy.assertDBWithRetries('selectFormTableDbRow', { bookingId: 124 }, (data: DbQueryResult) => {
          return data.rowCount === 1 && data.rows[0].prison_id === AGENCY_LOCATION.LEI.id
        })
        cy.task('selectLiteCategoryTableDbRow', { bookingId: 123 }).then((result: { rows: LiteCategoryDbRow[] }) => {
          return (
            result.rows.length === 2 &&
            result.rows.find(row => row.sequence === 1).prison_id === AGENCY_LOCATION.BMI.id &&
            result.rows.find(row => row.sequence === 2).prison_id === AGENCY_LOCATION.LEI.id
          )
        })
        cy.task('selectLiteCategoryTableDbRow', { bookingId: 124 }).then((result: { rows: LiteCategoryDbRow[] }) => {
          return result.rows.length === 1 && result.rows[0].prison_id === AGENCY_LOCATION.LEI.id
        })
        cy.task('selectRiskChangeTableDbRow', { offenderNo: 'B0010XY' }).then((result: { rows: RiskChangeDbRow[] }) => {
          return (
            result.rows.length === 2 &&
            result.rows.find(row => row.id === 1).prison_id === AGENCY_LOCATION.BMI.id &&
            result.rows.find(row => row.id === 2).prison_id === AGENCY_LOCATION.LEI.id
          )
        })
        cy.task('getSecurityReferral', { offenderNo: 'B0010XY' }).then((result: { rows: SecurityReferralDbRow[] }) => {
          return result.rows.length === 1 && result.rows[0].prison_id === AGENCY_LOCATION.BMI.id
        })
        cy.task('getSecurityReferral', { offenderNo: 'B0010XZ' }).then((result: { rows: SecurityReferralDbRow[] }) => {
          return result.rows.length === 1 && result.rows[0].prison_id === AGENCY_LOCATION.LEI.id
        })
      })
    })
  })
})
