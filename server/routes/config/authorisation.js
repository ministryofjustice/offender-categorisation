module.exports = {
  '/categoriser\\w+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/supervisor\\w+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/security\\w+': { authorised: ['ROLE_CATEGORISATION_SECURITY'] },
  '/tasklist/supervisor/.+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/tasklist/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/form/ratings/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/form/openConditions/.+': { authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_APPROVE_CATEGORISATION'] },
  '/form/categoriser/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/form/supervisor/.+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/form/security/.+': { authorised: ['ROLE_CATEGORISATION_SECURITY'] },
  '/form/approvedView/.+': { authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_APPROVE_CATEGORISATION'] },
}
