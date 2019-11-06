exports.up = knex => knex.schema.raw("ALTER TYPE security_referral_status_enum ADD VALUE 'COMPLETED'")

exports.down = () => Promise.resolve()

exports.config = { transaction: false }
