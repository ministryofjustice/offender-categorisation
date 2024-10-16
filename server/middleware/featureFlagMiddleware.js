const config = require('../config')

module.exports = async (req, res, next) => {
  const si607EnvVar = config.featureFlags.si607 ?? ''
  const si607EnabledPrisons = si607EnvVar.split(',').map(prisonId => prisonId.trim())

  res.locals.featureFlags = {
    si607EnabledPrisons,
  }

  return next()
}
