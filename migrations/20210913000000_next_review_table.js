exports.up = knex =>
  Promise.all([
    knex.schema.createTable('next_review_change_history', table => {
      table.increments('id').primary('pk_next_review_change_history')
      table.bigInteger('booking_id')
      table.string('offender_no', 10).notNullable()
      table.date('next_review_date').notNullable()
      table.text('reason').notNullable()
      table.timestamp('change_date').notNullable()
      table.string('changed_by').notNullable()

      table.index('offender_no')
    }),
  ])

exports.down = knex => knex.schema.dropTable('next_review_change_history')
