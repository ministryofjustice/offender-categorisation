const moment = require('moment')
const R = require('ramda')

const dateConverter = from => from && moment(from, 'YYYY-MM-DD').format('DD/MM/YYYY')

function plural(value) {
  return value > 1 ? 's' : ''
}

function formatValue(value, label) {
  return value > 0 ? `${value} ${label}${plural(value)}, ` : ''
}

const formatLength = sentenceTerms => {
  if (sentenceTerms.lifeSentence) {
    return 'Life'
  }
  const years = formatValue(sentenceTerms.years, 'year')
  const months = formatValue(sentenceTerms.months, 'month')
  const weeks = formatValue(sentenceTerms.weeks, 'week')
  const days = formatValue(sentenceTerms.days, 'day')
  const result = `${years}${months}${weeks}${days}`
  // chop off any trailing comma
  return result.endsWith(', ') ? result.substr(0, result.length - 2) : result
}

const properCase = word =>
  typeof word === 'string' && word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

function isBlank(str) {
  return !str || /^\s*$/.test(str)
}

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = name =>
  isBlank(name)
    ? ''
    : name
        .split('-')
        .map(properCase)
        .join('-')

const getHoursMinutes = timestamp => {
  const indexOfT = timestamp.indexOf('T')
  if (indexOfT < 0) {
    return ''
  }
  return timestamp.substr(indexOfT + 1, 5)
}

const isTodayOrAfter = date => {
  if (date === 'Today') {
    return true
  }
  const searchDate = moment(date, 'DD/MM/YYYY')
  return searchDate.isSameOrAfter(moment(), 'day')
}

const stripAgencyPrefix = (location, agency) => {
  const parts = location && location.split('-')
  if (parts && parts.length > 0) {
    const index = parts.findIndex(p => p === agency)
    if (index >= 0) {
      return location.substring(parts[index].length + 1, location.length)
    }
  }
  return location
}

const getLongDateFormat = date => {
  if (date && date !== 'Today') return moment(date, 'DD/MM/YYYY').format('dddd Do MMMM YYYY')
  return moment().format('dddd Do MMMM')
}

const linkOnClick = handlerFn => ({
  tabIndex: 0,
  role: 'link',
  onClick: handlerFn,
  onKeyDown: event => {
    if (event.key === 'Enter') handlerFn(event)
  },
})

const filterJsonObjectForLogging = json => {
  const dup = {}
  Object.keys(json).forEach(key => {
    if (key !== '_csrf') {
      dup[key] = json[key]
    }
  })
  return dup
}

const catDisplay = cat => {
  if (cat === 'I') return 'YOI Closed'
  if (cat === 'J') return 'YOI Open'
  return cat
}

// R.cond is like a switch statement
const calculateNextReviewDate = R.cond([
  [
    R.equals('6'),
    () =>
      moment()
        .add(6, 'months')
        .format('DD/MM/YYYY'),
  ],
  [
    R.equals('12'),
    () =>
      moment()
        .add(1, 'years')
        .format('DD/MM/YYYY'),
  ],
  [R.T, R.always('')],
])

module.exports = {
  dateConverter,
  formatLength,
  properCase,
  properCaseName,
  getHoursMinutes,
  isTodayOrAfter,
  stripAgencyPrefix,
  getLongDateFormat,
  linkOnClick,
  filterJsonObjectForLogging,
  catDisplay,
  calculateNextReviewDate,
}
