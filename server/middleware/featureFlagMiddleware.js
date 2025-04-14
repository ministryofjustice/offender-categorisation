const { config } = require('../config')

module.exports = async (req, res, next) => {
  res.locals.featureFlags = {
    three_to_five_policy_change: config.featureFlags.policy_change.three_to_five === 'true',
  }

  if (req.query?.overrideFeatureFlag !== undefined) {
    res.locals.featureFlags.three_to_five_policy_change = req.query.overrideFeatureFlag === 'true'
  }

  return next()
}
