const config = require('../config')

module.exports = async (req, res, next) => {
  const enableDpsHeader = config.featureFlags.dpsComponents.header || req.cookies.enableDpsComponentHeader === 'true'
  const enableDpsFooter = config.featureFlags.dpsComponents.footer || req.cookies.enableDpsComponentFooter === 'true'

  res.locals.featureFlag = {
    dpsHeader: enableDpsHeader,
    dpsFooter: enableDpsFooter,
  }

  res.locals.featureFlag.detected = Object.values(res.locals.featureFlag).some(value => value === true)

  return next()
}
