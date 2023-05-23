const { setup, defaultClient, DistributedTracingModes, Contracts } = require('applicationinsights')
const applicationVersion = require('../application-version')

const initialiseAppInsights = () => {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')
    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

const version = () => {
  const { buildNumber } = applicationVersion
  return buildNumber
}

const buildAppInsightsClient = (name = applicationVersion.packageData.name) => {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    defaultClient.context.tags['ai.cloud.role'] = `${name}`
    defaultClient.context.tags['ai.application.ver'] = version()
    return defaultClient
  }
  return null
}

const addUserDataToRequests = (envelope, contextObjects) => {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString.Request
  if (isRequest) {
    const { username, activeCaseLoadId } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    if (username) {
      const { properties } = envelope.data.baseData
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData.properties = {
        ...properties,
        username,
        activeCaseLoadId,
      }
    }
  }
  return true
}

module.exports = { initialiseAppInsights, buildAppInsightsClient, addUserDataToRequests }
