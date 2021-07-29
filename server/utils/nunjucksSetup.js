const nunjucks = require('nunjucks')
const Status = require('./statusEnum')
const ReviewReason = require('./reviewReasonEnum')
const {
  dateConverter,
  formatLength,
  getLongDateFormat,
  catDisplay,
  choosingHigherCategory,
  offenderLink,
  dpsUrl,
} = require('./utils')
const config = require('../config')
const { inProgress, extractNextReviewDate } = require('./functionalHelpers')

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
    .addGlobal('dpsHome', dpsUrl)
    .addGlobal('Status', Status)
    .addGlobal('ReviewReason', ReviewReason)
    .addGlobal('dateConverter', dateConverter)
    .addGlobal('getLongDateFormat', getLongDateFormat)
    .addGlobal('formatLength', formatLength)
    .addGlobal('googleAnalyticsKey', config.googleAnalyticsId)
    .addGlobal('catDisplay', catDisplay)
    .addGlobal('choosingHigherCategory', choosingHigherCategory)
    .addGlobal('inProgress', inProgress)
    .addGlobal('extractNextReviewDate', extractNextReviewDate)
}
