exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.integer('sequence_no').notNullable()
    table.jsonb('risk_profile').nullable()
    table.string('prison_id', 6).notNullable()
    table.string('offender_no', 10).notNullable()
    table.timestamp('start_date').notNullable()
    table.timestamp('approved_date').nullable()

    table.string('user_id', 32).alter()
    table.string('assigned_user_id', 32).alter()
    table.string('referred_by', 32).alter()
    table.string('status', 20).alter()

    table.unique(['booking_id', 'sequence_no'], 'booking_sequence_index')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropUnique(['booking_id', 'sequence_no'], 'booking_sequence_index')
    table.dropColumn('sequence_no')
    table.dropColumn('risk_profile')
    table.dropColumn('prison_id')
    table.dropColumn('offender_no')
    table.dropColumn('start_date')
    table.dropColumn('approved_date')
  })
