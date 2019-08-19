exports.up = knex =>
  Promise.all([
    knex.schema.createTable('risk_change', table => {
      table.increments('id').primary('pk_form')
      table.jsonb('oldProfile').nullable()
      table.jsonb('newProfile').nullable()
      table.bigInteger('booking_id').notNullable()
      table.string('user_id').notNullable()
      table.string('status').notNullable()
      table.string('assigned_user_id').nullable()
      table.timestamp('created_date').nullable()
    }),
  ])

exports.down = knex => knex.schema.dropTable('risk_change')
