/* eslint-disable import/no-import-module-exports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { addDays, getISODay, isAfter, isBefore, isValid, parseISO, parse } from 'date-fns'

import moment from 'moment'
import R from 'ramda'
import { dpsUrl, femalePrisonIds } from '../config'

export const dateConverter = (from: any) => from && moment(from, 'YYYY-MM-DD').format('DD/MM/YYYY')
export const dateConverterToISO = (from: string) => from && moment(from, 'DD/MM/YYYY').format('YYYY-MM-DD')

export const getLongDateFormat = (date: any) => {
  if (date) return moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY')
  return ''
}

export const getVerboseDateFormat = (date: any) => {
  if (date) return moment(date, 'DD/MM/YYYY').format('D MMMM YYYY')
  return ''
}

export const getLongDateFormatIso = date => {
  if (date) return moment(date).format('dddd D MMMM YYYY')
  return ''
}

function plural(value: number) {
  return value > 1 ? 's' : ''
}

function formatValue(value, label) {
  return value > 0 ? `${value} ${label}${plural(value)}, ` : ''
}

export const formatLength = sentenceTerms => {
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

const SATURDAY = 6
const SUNDAY = 0
const SUNDAY2 = 7

const get10BusinessDays = from => {
  let numberOfDays = 14
  switch (from.isoWeekday()) {
    case SATURDAY:
      numberOfDays += 2
      break
    case SUNDAY:
    case SUNDAY2:
      numberOfDays += 1
      break
    default:
  }
  return numberOfDays
}

// [TODO]: This function uses a fixed approximation of 10 business days by adding 14 calendar days,
//    and adding extra days if the start date is on a weekend.
//    -
//    For example, given a start date of Saturday 12 Jan 2019:
//      - Saturday is skipped, so the first business day is Monday 14 Jan
//      - 10 business days: 14, 15, 16, 17, 18 and 21, 22, 23, 24, 25 → ends on Friday 25 Jan
//      - However, this function adds 14 + 2 days (for starting on Saturday), resulting in 28 Jan (Mon)
//    -
//    This behaviour matches legacy expectations but is not a true business day calculation.
//    Re-evaluation recommended: proper handling should account for weekends and possibly public holidays
export const get10BusinessDaysLegacy = (startDate: Date): Date => {
  let daysToAdd = 14
  const weekday = getISODay(startDate) // 1 = Monday, 7 = Sunday

  if (weekday === 6) daysToAdd += 2 // Saturday
  if (weekday === 7) daysToAdd += 1 // Sunday

  return addDays(startDate, daysToAdd)
}

export const properCase = word =>
  typeof word === 'string' && word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

export function isBlank(str) {
  return !str || /^\s*$/.test(str)
}

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
export const properCaseName = name => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

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

const linkOnClick = handlerFn => ({
  tabIndex: 0,
  role: 'link',
  onClick: handlerFn,
  onKeyDown: event => {
    if (event.key === 'Enter') handlerFn(event)
  },
})

export const filterJsonObjectForLogging = json => {
  const dup = {}
  Object.keys(json).forEach(key => {
    if (key !== '_csrf') {
      dup[key] = json[key]
    }
  })
  return dup
}

export const catLabel = cat => {
  if (cat === 'B' || cat === 'C') return `Category ${catMappings(cat)}`
  return `${catMappings(cat)} category`
}

const replaceCatLabel = cat => {
  if (catLabel(cat).startsWith('Open') || catLabel(cat).startsWith('Closed')) return catLabel(cat).toLowerCase()
  return catLabel(cat)
}

export const catMappings = cat => {
  switch (cat) {
    case 'D':
      return 'Open'
    case 'I':
      return 'YOI closed'
    case 'J':
      return 'YOI open'
    case 'Q':
      return 'Restricted'
    case 'R':
      return 'Closed'
    case 'T':
      return 'Open'
    case 'U':
      return 'Unsentenced'
    default:
      return cat
  }
}

const displayIcon = cat => {
  if (cat === 'B' || cat === 'C') return cat
  return '!'
}

// R.cond is like a switch statement
export const calculateNextReviewDate = R.cond([
  [R.equals('6'), () => moment().add(6, 'months').format('D/M/YYYY')],
  [R.equals('12'), () => moment().add(1, 'years').format('D/M/YYYY')],
  [R.T, R.always('')],
])

const catMap = new Set(['DB', 'DC', 'DI', 'CB', 'JI', 'JC', 'JB', 'JD', 'JT', 'JR', 'TR', 'TI'])
export const choosingHigherCategory = (current, newCat) => catMap.has(current + newCat)

const offenderLink = offenderNo => `${dpsUrl}prisoner/${offenderNo}`
const offenderCaseNotesLink = offenderNo => `${dpsUrl}prisoner/${offenderNo}/case-notes`
const offenderAdjudicationLink = offenderNo => `${dpsUrl}prisoner/${offenderNo}/adjudications`
const offenderAlertsLink = offenderNo => `${dpsUrl}prisoner/${offenderNo}/alerts`

const convertToTitleCase = sentence =>
  sentence
    .split(' ')
    .map(word => properCaseName(word))
    .join(' ')

const sanitisePrisonName = prisonName => convertYoiToUpperCase(convertHmpToUpperCase(convertToTitleCase(prisonName)))

const convertHmpToUpperCase = prisonName => prisonName.replace(/hmp/gi, 'HMP')
const convertYoiToUpperCase = prisonName => prisonName.replace(/yoi/gi, 'YOI')

export const getNamesFromString = string =>
  string
    ?.split(', ')
    .reverse()
    .map(name => properCaseName(name))
    .join(' ')

export const isFemalePrisonId = prisonId => {
  const females = femalePrisonIds ? femalePrisonIds.split(',') : []
  return females.includes(prisonId)
}

export const setFemaleCaseLoads = caseLoads => {
  return caseLoads.map(c => {
    return { ...c, female: isFemalePrisonId(c.caseLoadId) }
  })
}

export const isOpenCategory = cat => {
  return ['D', 'J', 'T'].includes(cat)
}

/**
 * Safely checks whether date `a` is after date `b`.
 * Converts `b` to a Date if needed and ensures it's valid.
 */
export const safeIsAfter = (a: Date, b: Date | string | number | null | undefined): boolean => {
  if (b == null) return false

  const bDate = b instanceof Date ? b : new Date(b)

  return !isNaN(bDate.getTime()) && isAfter(a, bDate)
}

/**
 * Safely checks whether date `a` is before date `b`.
 * Converts `b` to a Date if needed and ensures it's valid.
 */
export const safeIsBefore = (a: Date, b: Date | string | number | null | undefined): boolean => {
  if (b == null) return false

  const bDate = b instanceof Date ? b : new Date(b)

  return !isNaN(bDate.getTime()) && isBefore(a, bDate)
}

export const normaliseDate = (input: unknown): Date | null => {
  if (input instanceof Date && isValid(input)) return input

  if (typeof input === 'string') {
    let parsed = parseISO(input)
    if (isValid(parsed)) return parsed

    parsed = parse(input, 'yyyy-MM-dd', new Date())
    if (isValid(parsed)) return parsed

    parsed = parse(input, 'dd/MM/yyyy', new Date())
    if (isValid(parsed)) return parsed
  }

  return null
}

module.exports = {
  dateConverter,
  dateConverterToISO,
  getLongDateFormat,
  getLongDateFormatIso,
  getVerboseDateFormat,
  formatLength,
  get10BusinessDays,
  properCase,
  properCaseName,
  getHoursMinutes,
  isTodayOrAfter,
  stripAgencyPrefix,
  linkOnClick,
  filterJsonObjectForLogging,
  catMappings,
  catLabel,
  displayIcon,
  replaceCatLabel,
  calculateNextReviewDate,
  choosingHigherCategory,
  offenderLink,
  dpsUrl,
  offenderCaseNotesLink,
  offenderAlertsLink,
  offenderAdjudicationLink,
  sanitisePrisonName,
  getNamesFromString,
  isFemalePrisonId,
  setFemaleCaseLoads,
  isOpenCategory,
  // exposed for test purposes
  isBlank,
  safeIsAfter,
  safeIsBefore,
  normaliseDate,
}
