const jwtDecode = require('jwt-decode')
const authorisationConfig = require('../routes/config/authorisation')
const { getWhereKeyLike, isEmpty } = require('../utils/functionalHelpers')
const { unauthorisedError } = require('../utils/errors')

module.exports = (req, res, next) => {
  if (req.originalUrl === '/') {
    return next() // always allow "/"
  }
  const config = getWhereKeyLike(req.originalUrl, authorisationConfig)
  if (isEmpty(config)) {
    return next(unauthorisedError())
  }

  const roles = jwtDecode(res.locals.user.token).authorities

  const authorisedRoles = config.authorised.filter(role => roles.includes(role))
  if (!authorisedRoles.length) {
    return next(unauthorisedError())
  }

  return next()
}
