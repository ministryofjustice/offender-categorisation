const nunjucks = require('nunjucks')
const Status = require('../utils/statusEnum')
const { dateConverter } = require('../utils/utils.js')
const config = require('../config')

const findError = (array, formFieldId) => {
  const item = array.find(error => error.href === `#${formFieldId}`)
  if (item) {
    return {
      text: item.text,
    }
  }
  return null
}

module.exports = (app, path) => {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv
    .addFilter('findError', findError)
    .addGlobal('Status', Status)
    .addGlobal('dateConverter', dateConverter)
    .addGlobal('googleAnalyticsKey', config.googleAnalyticsId)
}
