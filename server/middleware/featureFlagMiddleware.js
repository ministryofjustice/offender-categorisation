module.exports = async (req, res, next) => {
  res.locals.featureFlags = {}
  return next()
}
