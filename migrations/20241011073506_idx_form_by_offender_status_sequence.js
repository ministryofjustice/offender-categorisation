exports.up = knex =>
  knex.schema.table('form', table => {
    table.index(['offender_no', 'status', 'sequence_no'], 'idx_form_offender_no_status_sequence_no')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropIndex(['offender_no', 'status', 'sequence_no'], 'idx_form_offender_no_status_sequence_no')
  })
