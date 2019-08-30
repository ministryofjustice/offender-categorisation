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

  if (res.locals && res.locals.user && res.locals.user.token) {
    const roles = jwtDecode(res.locals.user.token).authorities

    const authorisedRoles = roles ? config.authorised.filter(role => roles.includes(role)) : []
    if (!authorisedRoles.length) {
      return next(unauthorisedError())
    }

    const applicationRoles = buildApplicationRoles(roles)

    if (Object.keys(applicationRoles).length > 1) {
      res.locals.user = { multipleRoles: applicationRoles, ...res.locals.user }
    }

    return next()
  }
  // No session: get one created
  req.session.returnTo = req.originalUrl
  return res.redirect('/login')
}

const buildApplicationRoles = roles => {
  const applicationRoles = {
    ...(roles.includes('ROLE_APPROVE_CATEGORISATION') && { supervisor: true }),
    ...(roles.includes('ROLE_CREATE_CATEGORISATION') && { categoriser: true }),
    ...(roles.includes('ROLE_CREATE_RECATEGORISATION') && { recategoriser: true }),
    ...(roles.includes('ROLE_CATEGORISATION_SECURITY') && { security: true }),
    ...(roles.includes('ROLE_CATEGORISATION_READONLY') && { readonly: true }),
  }
  return applicationRoles
}
