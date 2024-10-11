exports.up = knex =>
  knex.schema.raw('CREATE INDEX idx_form_booking_id_sequence_no_desc ON form (booking_id, sequence_no DESC)')

exports.down = knex => knex.schema.raw('DROP INDEX idx_form_booking_id_sequence_no_desc')
g
