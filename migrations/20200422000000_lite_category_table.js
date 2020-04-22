exports.up = knex =>
  Promise.all([
    knex.schema.createTable('lite_category', table => {
      table.bigInteger('booking_id')
      table.integer('sequence').notNullable()
      table.string('category', 6).notNullable()
      table.string('supervisor_category', 6)
      table.string('offender_no').notNullable()
      table.string('prison_id', 6).notNullable()
      table.timestamp('created_date').notNullable()
      table.timestamp('approved_date')
      table.string('assessed_by').notNullable()
      table.string('approved_by')

      table.index('offender_no')
      table.index('approved_date')
      table.index('prison_id')
      table.primary(['booking_id', 'sequence'])
    }),
  ])

exports.down = knex => knex.schema.dropTable('lite_category')
