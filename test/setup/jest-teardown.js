const { pool } = require('../../server/data/dataAccess/db')

const globalTearDown = async () => {
  afterAll(async () => {
    await pool.end()
  })
}

module.exports = globalTearDown
