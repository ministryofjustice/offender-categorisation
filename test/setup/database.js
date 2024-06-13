const path = require('path')
const knexConfig = require('../../knexfile')

const knexUnitTestConfig = {
  ...knexConfig,
  // debug: true,
  migrations: {
    directory: path.join(__dirname, '/../../migrations'),
  },
}
// eslint-disable-next-line import/order
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
