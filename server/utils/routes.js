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

function redirectUsingRole(res, categoriserUrl, supervisorUrl, securityUrl) {
  const roles = jwtDecode(res.locals.user.token).authorities

  if (supervisorUrl && roles && roles.includes('ROLE_APPROVE_CATEGORISATION')) {
    res.redirect(supervisorUrl)
  } else if (categoriserUrl && roles && roles.includes('ROLE_CREATE_CATEGORISATION')) {
    res.redirect(categoriserUrl)
  } else if (securityUrl && roles && roles.includes('ROLE_CATEGORISATION_SECURITY')) {
    res.redirect(securityUrl)
  } else {
    // go to a 'not auth' page
    res.status(403)
    res.render('autherror')
  }
}
