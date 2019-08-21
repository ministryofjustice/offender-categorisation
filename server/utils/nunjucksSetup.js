const nunjucks = require('nunjucks')
const Status = require('../utils/statusEnum')
const ReviewReason = require('../utils/reviewReasonEnum')
const {
  dateConverter,
  formatLength,
  getLongDateFormat,
  catDisplay,
  choosingHigherCategory,
  offenderLink,
} = require('../utils/utils.js')
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
      'node_modules/govuk-frontend/govuk/',
      'node_modules/govuk-frontend/govuk/components/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  njkEnv
    .addFilter('findError', findError)
    .addFilter('offenderLink', offenderLink)
    .addGlobal('Status', Status)
    .addGlobal('ReviewReason', ReviewReason)
    .addGlobal('dateConverter', dateConverter)
    .addGlobal('getLongDateFormat', getLongDateFormat)
    .addGlobal('formatLength', formatLength)
    .addGlobal('googleAnalyticsKey', config.googleAnalyticsId)
    .addGlobal('catDisplay', catDisplay)
    .addGlobal('choosingHigherCategory', choosingHigherCategory)
}
