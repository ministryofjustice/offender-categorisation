exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.timestamp('cancelled_date').nullable()
    table.string('cancelled_by').nullable()
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('cancelled_by')
    table.dropColumn('cancelled_date')
  })
