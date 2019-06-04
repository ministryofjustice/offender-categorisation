const jwtDecode = require('jwt-decode')

module.exports = {
  getPathFor,
  redirectUsingRole,
}

function getPathFor({ data, config }) {
  const { nextPath } = config

  if (!nextPath.decisions) {
    return nextPath.path
  }

  if (Array.isArray(nextPath.decisions)) {
    return determinePathFromDecisions({ decisions: nextPath.decisions, data }) || nextPath.path
  }

  return getPathFromAnswer({ nextPath: nextPath.decisions, data })
}

function getPathFromAnswer({ nextPath, data }) {
  const decidingValue = data[nextPath.discriminator]
  return nextPath[decidingValue]
}

function determinePathFromDecisions({ decisions, data }) {
  return decisions.reduce((path, pathConfig) => path || getPathFromAnswer({ nextPath: pathConfig, data }), null)
}

function redirectUsingRole(req, res, categoriserUrl, supervisorUrl, securityUrl, recategoriserUrl) {
  const roles = jwtDecode(res.locals.user.token).authorities

  if (req.session && req.session.currentRole) {
    res.redirect(lookupRoleUrl(req.session.currentRole, categoriserUrl, supervisorUrl, securityUrl, recategoriserUrl))
  } else if (roles && roles.includes('ROLE_APPROVE_CATEGORISATION')) {
    req.session.currentRole = `supervisor`
    res.redirect(supervisorUrl)
  } else if (roles && roles.includes('ROLE_CREATE_RECATEGORISATION')) {
    req.session.currentRole = `recategoriser`
    res.redirect(recategoriserUrl)
  } else if (roles && roles.includes('ROLE_CREATE_CATEGORISATION')) {
    req.session.currentRole = `categoriser`
    res.redirect(categoriserUrl)
  } else if (roles && roles.includes('ROLE_CATEGORISATION_SECURITY')) {
    req.session.currentRole = `security`
    res.redirect(securityUrl)
  } else {
    // go to a 'not auth' page
    res.status(403)
    res.render('autherror')
  }
}

function lookupRoleUrl(role, categoriserUrl, supervisorUrl, securityUrl, recategoriserUrl) {
  switch (role) {
    case 'supervisor':
      return supervisorUrl
    case 'categoriser':
      return categoriserUrl
    case 'security':
      return securityUrl
    case 'recategoriser':
      return recategoriserUrl
    default:
      return undefined
  }
}
