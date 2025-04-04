const jwtDecode = require('jwt-decode')
const authorisationConfig = require('../routes/config/authorisation')
const { getWhereKeyLike, isEmpty } = require('../utils/functionalHelpers')
const { unauthorisedError } = require('../utils/errors')

const allCatRoles = [
  'ROLE_CREATE_CATEGORISATION',
  'ROLE_CREATE_RECATEGORISATION',
  'ROLE_APPROVE_CATEGORISATION',
  'ROLE_CATEGORISATION_SECURITY',
]

function isCat(role) {
  return allCatRoles.indexOf(role) >= 0
}

module.exports = (userService, offendersService) => async (req, res, next) => {
  if (req.originalUrl === '/') {
    return next() // always allow "/"
  }
  const config = getWhereKeyLike(req.originalUrl, authorisationConfig)
  if (isEmpty(config)) {
    return next(unauthorisedError('Url not recognised'))
  }

  if (res.locals && res.locals.user && res.locals.user.token) {
    const { authorities } = jwtDecode(res.locals.user.token)
    const roles = authorities ? authorities.filter(role => isCat(role)) : []
    const isOpen = config.authorised[0] === 'BOOKING_ID_IN_CASELOAD'
    const authorisedRoles = isOpen ? roles : config.authorised.filter(role => roles.includes(role))
    if (!authorisedRoles.length) {
      if (!isOpen) {
        return next(unauthorisedError())
      }
      // retrieve booking id
      const lastBit = req.path.split('/').reverse()[0]
      if (Number.isNaN(parseInt(lastBit, 10))) {
        return next(unauthorisedError('Failed to parse booking id'))
      }
      const bookingId = parseInt(lastBit, 10)

      // Check prisoner is in caseload
      try {
        const details = await offendersService.getBasicOffenderDetails(res.locals, bookingId)
        const user = await userService.getUser(res.locals)
        const found = user.activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === details.agencyId)
        if (!found) {
          return next(unauthorisedError('Prisoner is not in this prison'))
        }
      } catch {
        return next(unauthorisedError('Booking id not found'))
      }
    }

    const applicationRoles = buildApplicationRoles(roles)
    res.locals.user = {
      roles: applicationRoles,
      numberOfRoles: Object.keys(applicationRoles).length,
      ...res.locals.user,
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
  }
  return applicationRoles
}
