const nunjucks = require('nunjucks')
const Status = require('./statusEnum')
const ReviewReason = require('./reviewReasonEnum')
const {
  dateConverter,
  formatLength,
  getLongDateFormat,
  getVerboseDateFormat,
  catMappings,
  catLabel,
  displayIcon,
  replaceCatLabel,
  choosingHigherCategory,
  offenderLink,
  dpsUrl,
  isOpenCategory,
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
      'node_modules/govuk-frontend/dist/govuk/',
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/dist/govuk/components/',
      'node_modules/@ministryofjustice/frontend/',
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
    .addGlobal('supportUrl', config.supportUrl)
    .addGlobal('Status', Status)
    .addGlobal('ReviewReason', ReviewReason)
    .addGlobal('dateConverter', dateConverter)
    .addGlobal('getLongDateFormat', getLongDateFormat)
    .addGlobal('getVerboseDateFormat', getVerboseDateFormat)
    .addGlobal('formatLength', formatLength)
    .addGlobal('googleAnalyticsKey', config.googleAnalyticsId)
    .addGlobal('googleTagManagerKey', config.googleTagManagerTag)
    .addGlobal('catMappings', catMappings)
    .addGlobal('catLabel', catLabel)
    .addGlobal('displayIcon', displayIcon)
    .addGlobal('replaceCatLabel', replaceCatLabel)
    .addGlobal('choosingHigherCategory', choosingHigherCategory)
    .addGlobal('inProgress', inProgress)
    .addGlobal('extractNextReviewDate', extractNextReviewDate)
    .addGlobal('isOpenCategory', isOpenCategory)
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
