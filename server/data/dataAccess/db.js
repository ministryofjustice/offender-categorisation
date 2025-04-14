const { Pool, types } = require('pg')
const fs = require('fs')
const { hostname } = require('os')
const logger = require('../../../log')
const { config } = require('../../config')

types.setTypeParser(20, val => parseInt(val, 10))

const pool = new Pool({
  user: config.db.username,
  host: config.db.server,
  database: config.db.database,
  password: config.db.password,
  port: 5432,
  application_name: hostname(),
  ssl:
    config.db.sslEnabled === 'true'
      ? {
          ca: fs.readFileSync('/app/root.cert'),
          rejectUnauthorized: true,
        }
      : false,
})

pool.on('error', error => {
  logger.error('Unexpected error on idle client', error)
})

module.exports = {
  doTransactional: async callback => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await callback(client)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  pool, // for testing only
  query: (text, params) => pool.query(text, params),
}
