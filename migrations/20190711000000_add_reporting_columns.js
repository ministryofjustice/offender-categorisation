exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.date('assessment_date').nullable()
    table.string('approved_by').nullable()
    table.string('assessed_by').nullable()
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('assessment_date')
    table.dropColumn('approved_by')
    table.dropColumn('assessed_by')
  })
