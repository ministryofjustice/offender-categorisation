exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.enum('review_reason', ['DUE', 'AGE', 'MANUAL', 'RISK_CHANGE'], {
      useNative: true,
      enumName: 'review_reason_enum',
    })
  })

exports.down = knex =>
  knex.schema
    .table('form', table => {
      table.dropColumn('review_reason')
    })
    .then(() => knex.raw(`drop type review_reason_enum`))
