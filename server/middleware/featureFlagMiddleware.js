const config = require('../config')
const logger = require('../../log')

module.exports = async (req, res, next) => {
  const si607EnvVar = config.featureFlags.si607 ?? ''
  const si607EnabledPrisons = si607EnvVar.split(',').map(prisonId => prisonId.trim())

  res.locals.featureFlags = {
    si607EnabledPrisons,
  }

  logger.debug('SI-607', {
    featureFlags: res.locals.featureFlags,
    si607EnvVar,
  })

  return next()
}
