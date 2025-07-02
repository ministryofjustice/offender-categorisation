const { serviceCheckFactory, dbCheck } = require('../data/healthCheck')
const { config } = require('../config')

const { productId } = config

const service = (name, url) => {
  const check = serviceCheckFactory(name, url)
  return () =>
    check()
      .then(result => ({ name, status: 'UP', message: result }))
      .catch(err => ({ name, status: 'ERROR', message: err }))
}

const gatherCheckInfo = (total, currentValue) => ({ ...total, [currentValue.name]: currentValue.message })

const getBuild = () => {
  try {
    // eslint-disable-next-line import/no-unresolved,global-require
    return require('../../build-info.json')
  } catch (ex) {
    return null
  }
}

const addAppInfo = result => {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    productId,
    build: buildInformation,
    version: (buildInformation && buildInformation.buildNumber) || 'Not available',
  }

  return { ...result, ...buildInfo }
}

const db = () =>
  dbCheck()
    .then(() => ({ name: 'db', status: 'UP', message: 'UP' }))
    .catch(err => ({ name: 'db', status: 'ERROR', message: err.message }))

module.exports = function healthcheckFactory(
  authUrl,
  elite2Url,
  riskProfilerUrl,
  allocationUrl,
  prisonerSearchUrl,
  pathfinderApiUrl,
) {
  const checks = [
    service('auth', `${authUrl}/ping`),
    service('elite2', `${elite2Url}health/ping`),
    service('riskProfiler', `${riskProfilerUrl}ping`),
    service('allocation', `${allocationUrl}health`),
    service('prisonerSearch', `${prisonerSearchUrl}health/ping`),
    service('pathfinderApi', `${pathfinderApiUrl}health/ping`),
    db,
  ]

  return callback =>
    Promise.all(checks.map(fn => fn())).then(checkResults => {
      const allOk = checkResults.every(item => item.status === 'UP') ? 'UP' : 'DOWN'
      const result = {
        name: 'offender-categorisation',
        status: allOk,
        api: checkResults.reduce(gatherCheckInfo, {}),
      }
      callback(null, addAppInfo(result))
    })
}
