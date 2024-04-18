exports.up = knex =>
  knex.schema.alterTable('lite_category', table => {
    table.string('approved_category_comment').nullable()
  })

exports.down = knex =>
  knex.schema.table('lite_category', table => {
    table.dropColumn('approved_category_comment')
  })
