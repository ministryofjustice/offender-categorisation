exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.date('due_by_date').nullable()
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('due_by_date')
  })
