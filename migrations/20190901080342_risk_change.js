exports.up = knex =>
  Promise.all([
    knex.schema.createTable('risk_change', table => {
      table.increments('id').primary('pk_risk_change')
      table.jsonb('old_profile').notNullable()
      table.jsonb('new_profile').notNullable()
      table.string('offender_no').notNullable()
      table.string('user_id').nullable()
      table.string('prison_id', 6).notNullable()
      table
        .enum('status', ['NEW', 'REVIEW_REQUIRED', 'REVIEW_NOT_REQUIRED'], {
          useNative: true,
          enumName: 'risk_change_status_enum',
        })
        .notNullable()
        .defaultTo('NEW')
      table.timestamp('raised_date').notNullable()
      table.index('prison_id')
    }),
  ])

exports.down = knex => knex.schema.dropTable('risk_change').then(() => knex.raw(`drop type risk_change_status_enum`))
