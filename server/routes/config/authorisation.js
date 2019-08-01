module.exports = {
  '/categoriser\\w+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/recategoriser\\w+': { authorised: ['ROLE_CREATE_RECATEGORISATION'] },
  '/supervisor\\w+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/security\\w+': { authorised: ['ROLE_CATEGORISATION_SECURITY'] },
  '/tasklist/supervisor/.+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/tasklist/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/tasklistRecat/.+': { authorised: ['ROLE_CREATE_RECATEGORISATION'] },
  '/openConditionsAdded/.+': { authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_CREATE_RECATEGORISATION'] },
  '/form/recat/.+': { authorised: ['ROLE_CREATE_RECATEGORISATION'] },
  '/form/ratings/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/form/openConditions/.+': {
    authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_CREATE_RECATEGORISATION', 'ROLE_APPROVE_CATEGORISATION'],
  },
  '/form/categoriser/.+': { authorised: ['ROLE_CREATE_CATEGORISATION'] },
  '/form/supervisor/supervisorMessage/.+': {
    authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_CREATE_RECATEGORISATION'],
  },
  '/form/supervisor/.+': { authorised: ['ROLE_APPROVE_CATEGORISATION'] },
  '/form/security/.+': { authorised: ['ROLE_CATEGORISATION_SECURITY'] },
  '/form/approvedView/.+': { authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_APPROVE_CATEGORISATION'] },
  '/\\d+': { authorised: ['ROLE_CREATE_CATEGORISATION', 'ROLE_CREATE_RECATEGORISATION'] },
  '/switchRole/.+': {
    authorised: [
      'ROLE_CREATE_CATEGORISATION',
      'ROLE_CREATE_RECATEGORISATION',
      'ROLE_APPROVE_CATEGORISATION',
      'ROLE_CATEGORISATION_SECURITY',
    ],
  },
}
