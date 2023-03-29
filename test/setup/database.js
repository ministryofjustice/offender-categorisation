const path = require('path')

const knexUnitTestConfig = {
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOSTNAME || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5434,
    user: 'form-builder-unit-tests',
    password: 'form-builder-unit-tests',
    database: 'form-builder-unit-tests',
    ssl: false,
  },
  // debug: true,
  migrations: {
    directory: path.join(__dirname, '/../../migrations'),
  },
}
const knex = require('knex')(knexUnitTestConfig)

const migrate = async () => {
  try {
    // run knex migrations
    await knex.migrate.latest()
    // console.log('migration complete')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}

const rollback = async () => {
  try {
    // rollback knex migrations
    await knex.migrate.rollback()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}

module.exports = {
  knex,
  setUp: async () => {
    await migrate()
  },
  tearDown: async () => {
    await rollback()
  },
}
