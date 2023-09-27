const config = require('../config')

module.exports = async (req, res, next) => {
  const securityHeaders = config.featureFlags.securityHeaders || req.cookies.enableUpdatedSecurityHeaders === 'true'
  const enableDpsHeader = config.featureFlags.dpsComponents.header || req.cookies.enableDpsComponentHeader === 'true'
  const enableDpsFooter = config.featureFlags.dpsComponents.footer || req.cookies.enableDpsComponentFooter === 'true'

  res.locals.featureFlag = {
    securityHeaders,
    dpsHeader: enableDpsHeader,
    dpsFooter: enableDpsFooter,
  }

  res.locals.featureFlag.detected = Object.values(res.locals.featureFlag).some(value => value === true)

  return next()
}
