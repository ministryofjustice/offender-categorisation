const config = require('../config')

const isTruthy = value => value === 'true'

module.exports = async (req, res, next) => {
  const enableDpsHeader =
    isTruthy(config.featureFlags.dpsComponents.header) || isTruthy(req.cookies.enableDpsComponentHeader)
  const enableDpsFooter =
    isTruthy(config.featureFlags.dpsComponents.footer) || isTruthy(req.cookies.enableDpsComponentFooter)

  res.locals.featureFlag = {
    securityHeaders,
    dpsHeader: enableDpsHeader,
    dpsFooter: enableDpsFooter,
  }

  res.locals.featureFlag.detected = Object.values(res.locals.featureFlag).some(value => value === true)

  return next()
}
