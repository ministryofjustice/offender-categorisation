exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table
      .enum('cat_type', ['INITIAL', 'RECAT'], { useNative: true, enumName: 'cat_type_enum' })
      .notNullable()
      .defaultTo('INITIAL')
  })

exports.down = knex =>
  knex.schema
    .table('form', table => {
      table.dropColumn('cat_type')
    })
    .then(() => knex.raw(`drop type cat_type_enum`))
