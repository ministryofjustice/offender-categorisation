exports.up = knex =>
  knex.schema.alterTable('lite_category', table => {
    table.string('assessment_committee', 12).notNullable()
    table.string('assessment_comment', 4000)
    table.date('next_review_date').notNullable()
    table.string('placement_prison_id', 6)
    table.string('approved_committee', 12)
    table.string('approved_placement_prison_id', 6)
    table.string('approved_placement_comment', 240)
    table.string('approved_comment', 240)
  })

exports.down = knex =>
  knex.schema.table('lite_category', table => {
    table.dropColumn('assessment_committee')
    table.dropColumn('assessment_comment')
    table.dropColumn('next_review_date')
    table.dropColumn('placement_prison_id')
    table.dropColumn('approved_committee')
    table.dropColumn('approved_placement_prison_id')
    table.dropColumn('approved_placement_comment')
    table.dropColumn('approved_comment')
  })
