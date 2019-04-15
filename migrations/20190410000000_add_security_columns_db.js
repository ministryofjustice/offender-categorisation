exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.string('security_reviewed_by', 32)
    table.timestamp('security_reviewed_date')
    table.index('prison_id')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('security_reviewed_by')
    table.dropColumn('security_reviewed_date')
  })
