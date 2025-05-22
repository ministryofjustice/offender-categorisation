/* eslint-disable no-param-reassign */
const nunjucks = require('nunjucks')
const Status = require('./statusEnum').default
const ReviewReason = require('./reviewReasonEnum')
const {
  dateConverter,
  formatLength,
  getLongDateFormat,
  getLongDateFormatIso,
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
const { config } = require('../config')
const { inProgress, extractNextReviewDate } = require('./functionalHelpers')
const { removeFilterFromFullUrl } = require('./nunjucks.utility')

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
    },
  )

  app.locals.appInsightsConnectionString = config.appInsightsConnectionString
  app.locals.appInsightsApplicationName = 'Offender Categorisation'
  app.locals.buildNumber = config.buildNumber

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
    .addGlobal('getLongDateFormatIso', getLongDateFormatIso)
    .addGlobal('getVerboseDateFormat', getVerboseDateFormat)
    .addGlobal('formatLength', formatLength)
    .addGlobal('googleTagManagerKey', config.googleTagManagerTag)
    .addGlobal('catMappings', catMappings)
    .addGlobal('catLabel', catLabel)
    .addGlobal('displayIcon', displayIcon)
    .addGlobal('replaceCatLabel', replaceCatLabel)
    .addGlobal('choosingHigherCategory', choosingHigherCategory)
    .addGlobal('inProgress', inProgress)
    .addGlobal('extractNextReviewDate', extractNextReviewDate)
    .addGlobal('isOpenCategory', isOpenCategory)
    .addGlobal('removeFilterFromFullUrl', removeFilterFromFullUrl)
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
    .addFilter('sortDateValue', date => {
      if (!date || date === 'null' || date === 'undefined') {
        return Infinity
      }

      const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (isoMatch) {
        return new Date(date).getTime()
      }

      const ukMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (ukMatch) {
        return new Date(`${ukMatch[3]}-${ukMatch[2]}-${ukMatch[1]}`).getTime()
      }

      return date
    })
    .addGlobal('is3to5PolicyChangeAlertBannerExpired', () => {
      // FIXME remove after 2025-05-28
      return new Date() >= new Date('2025-05-28')
    })
}
