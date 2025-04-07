exports.up = knex =>
  knex.schema
    .alterTable('form', table => {
      table.date('approval_date').nullable()
    })
    .then(() =>
      knex.raw(`
    update form set approval_date = CURRENT_DATE where approval_date is null and status = 'APPROVED'
      `),
    )

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('approval_date')
  })
