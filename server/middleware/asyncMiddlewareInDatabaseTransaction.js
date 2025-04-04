const db = require('../data/dataAccess/db')

module.exports = fn => (req, res, next) => {
  Promise.resolve(
    db.doTransactional(async client => {
      await fn(req, res, client)
    }),
  ).catch(next)
}
