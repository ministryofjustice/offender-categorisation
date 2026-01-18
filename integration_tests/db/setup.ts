import path from 'path'
import knexConfig from '../../knexfile'

const knexUnitTestConfig = {
  ...knexConfig,
  // debug: true,
  migrations: {
    directory: path.join(__dirname, '/../../migrations'),
  },
}
// eslint-disable-next-line import/order,@typescript-eslint/no-var-requires
const knex = require('knex')(knexUnitTestConfig)

const migrate = async () => {
  try {
    // run knex migrations
    await knex.migrate.latest()
    // console.log('migration complete')
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return false
  }
}

const rollback = async () => {
  try {
    // rollback knex migrations
    await knex.migrate.rollback({}, true)
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return false
  }
}

export default {
  setUpDb: async () => {
    await rollback()
    return migrate()
  },
  tearDownDb: async () => {
    return rollback()
  },
}
