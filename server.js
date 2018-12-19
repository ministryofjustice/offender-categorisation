const knex = require('knex')
const knexfile = require('./knexfile')
const app = require('./server/index')
const log = require('./log')

// See https://knexjs.org
knex({
  ...knexfile,
  log: {
    warn(message) {
      log.warn(message)
    },
    error(message) {
      log.error(message)
    },
    deprecate(message) {
      log.info(message)
    },
    debug(message) {
      log.debug(message)
    },
  },
  debug: true,
})
  .migrate.latest({ debug: true })
  .then(() => {
    // migrations are finished
    app.listen(app.get('port'), () => {
      log.info(`Server listening on port ${app.get('port')}`)
    })
  })
