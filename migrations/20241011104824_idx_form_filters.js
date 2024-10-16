exports.up = knex =>
  knex.schema.table('form', table => {
    table.index(['prison_id', 'status', 'cat_type', 'review_reason'], 'idx_form_filters')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropIndex(['prison_id', 'status', 'cat_type', 'review_reason'], 'idx_form_filters')
  })
