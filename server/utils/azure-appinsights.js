const appInsights = require('applicationinsights')
const applicationVersion = require('../application-version')

const { packageData } = applicationVersion
const key = process.env.APPINSIGHTS_INSTRUMENTATIONKEY
if (key) {
  // eslint-disable-next-line no-console
  console.log(`Enabling azure application insights using key [${key}]`)
  appInsights.setup().start()
  module.exports = appInsights.defaultClient
  appInsights.defaultClient.context.tags['ai.cloud.role'] = `${packageData.name}`
} else {
  module.exports = null
}
