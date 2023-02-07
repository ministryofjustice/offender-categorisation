const nunjucks = require('nunjucks')
const Status = require('./statusEnum')
const ReviewReason = require('./reviewReasonEnum')
const {
  dateConverter,
  formatLength,
  getLongDateFormat,
  getVerboseDateFormat,
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
    .addGlobal('manageAccountUrl', config.apis.oauth2.manageAccountUrl)
    .addGlobal('Status', Status)
    .addGlobal('ReviewReason', ReviewReason)
    .addGlobal('dateConverter', dateConverter)
    .addGlobal('getLongDateFormat', getLongDateFormat)
    .addGlobal('getVerboseDateFormat', getVerboseDateFormat)
    .addGlobal('formatLength', formatLength)
    .addGlobal('googleAnalyticsKey', config.googleAnalyticsId)
    .addGlobal('catDisplay', catDisplay)
    .addGlobal('choosingHigherCategory', choosingHigherCategory)
    .addGlobal('inProgress', inProgress)
    .addGlobal('extractNextReviewDate', extractNextReviewDate)
    .addFilter('initialiseName', fullName => {
      // this check is for the authError page
      if (!fullName) {
        return null
      }
      const array = fullName.split(' ')
      return `${array[0][0]}. ${array.reverse()[0]}`
    })
    .addFilter('fixed', (num, length) => {
      return num.toFixed(length || 1)
    })
}
