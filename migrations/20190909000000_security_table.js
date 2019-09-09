exports.up = knex =>
  Promise.all([
    knex.schema.createTable('security_referral', table => {
      table.increments('id').primary('pk_security_referral')
      table.bigInteger('booking_id').notNullable()
      table.string('offender_no').notNullable()
      table.string('user_id').notNullable()
      table.string('prison_id', 6).notNullable()
      table
        .enum('status', ['NEW', 'REFERRED'], {
          useNative: true,
          enumName: 'security_referral_status_enum',
        })
        .notNullable()
        .defaultTo('NEW')
      table.timestamp('raised_date').notNullable()
      table.timestamp('processed_date')
      table.unique('booking_id')
      table.index('prison_id')
    }),
  ])

exports.down = knex =>
  knex.schema.dropTable('security_referral').then(() => knex.raw(`drop type security_referral_status_enum`))
