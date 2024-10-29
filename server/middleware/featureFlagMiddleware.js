const config = require('../config')

module.exports = async (req, res, next) => {
  const si607EnvVar = config.featureFlags.si607 ?? ''
  const si607EnabledPrisons = si607EnvVar.split(',').map(prisonId => prisonId.trim())
  const recategorisationPrioritisationEnvVar = config.featureFlags.recategorisationPrioritisation ?? ''
  const recategorisationPrioritisationEnabledPrisons = recategorisationPrioritisationEnvVar
    .split(',')
    .map(prisonId => prisonId.trim())

  res.locals.featureFlags = {
    si607EnabledPrisons,
    recategorisationPrioritisationEnabledPrisons,
    show_recategorisation_prioritisation_filter: req.cookies.show_recategorisation_prioritisation_filter === 'true',
  }

  return next()
}
