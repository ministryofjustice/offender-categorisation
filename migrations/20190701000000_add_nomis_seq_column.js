exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.integer('nomis_sequence_no')
    table.unique(['booking_id', 'nomis_sequence_no'], 'booking_nomis_sequence_index')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropUnique(['booking_id', 'nomis_sequence_no'], 'booking_nomis_sequence_index')
    table.dropColumn('nomis_sequence_no')
  })
