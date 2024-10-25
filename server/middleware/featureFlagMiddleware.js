const config = require('../config')

module.exports = async (req, res, next) => {
  const si607EnvVar = config.featureFlags.si607 ?? ''
  const si607EnabledPrisons = si607EnvVar.split(',').map(prisonId => prisonId.trim())

  res.locals.featureFlags = {
    si607EnabledPrisons,
    show_recategorisation_prioritisation_filter:
      config.featureFlags?.recategorisationPrioritisation?.show_filter === 'true' ||
      req.cookies.show_recategorisation_prioritisation_filter === 'true',
  }

  return next()
}
