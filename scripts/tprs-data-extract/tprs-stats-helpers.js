const moment = require('moment/moment')
const db = require('../../server/data/dataAccess/db')

const startDate = '2000-01-01'
const today = moment().format('YYYY-MM-DD')

const catType = { INITIAL: 'INITIAL', RECAT: 'RECAT' }

module.exports = {
  defaults: {
    startDate,
    endDate: today,
  },
  catType,
  db,
}
