const config = require('../config')

module.exports = async (req, res, next) => {
  const recategorisationPrioritisationEnvVar = config.featureFlags.recategorisationPrioritisation ?? ''
  const recategorisationPrioritisationEnabledPrisons = recategorisationPrioritisationEnvVar
    .split(',')
    .map(prisonId => prisonId.trim())

  res.locals.featureFlags = {
    recategorisationPrioritisationEnabledPrisons,
    show_recategorisation_prioritisation_filter: req.cookies.show_recategorisation_prioritisation_filter === 'true',
  }

  return next()
}
