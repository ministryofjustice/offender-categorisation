/* eslint-disable no-param-reassign */
const { config } = require('../config')

module.exports = app => {
  app.locals.environmentName = config.environment
  app.locals.environmentNameColour = config.environment !== 'prod' ? 'govuk-tag--green' : ''
}
