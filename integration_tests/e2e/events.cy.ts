import dbSeeder, { dbSeederLiteCategory } from '../fixtures/db-seeder'
import mensUnapprovedInitialCategorisationSeedData from '../fixtures/events/mensUnapprovedInitialCategorisationSeedData'
import mensUnapprovedRecategorisationSeedData from '../fixtures/events/mensUnapprovedRecategorisationSeedData'
import mensUnapprovedLiteCategorisationSeedData from '../fixtures/events/mensUnapprovedLiteCategorisationSeedData'

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
})
