const R = require('ramda')
const Status = require('./statusEnum')

module.exports = {
  getIn: R.path,
  equals: R.equals,
  isNilOrEmpty,
  firstItem: R.head,
  getFieldDetail,
  getFieldName,
  isEmpty,
  mergeWithRight,
  lastItem,
  pickBy: R.pickBy,
  getWhereKeyLike,
  replace,
  groupBy,
  isFirstVisit,
  inProgress,
  extractNextReviewDate,
}

function isNilOrEmpty(item) {
  return R.isEmpty(item) || R.isNil(item)
}

function getFieldDetail(fieldPath, fieldConfig) {
  return R.pipe(R.values, R.head, R.path(fieldPath))(fieldConfig)
}

function getFieldName(fieldConfig) {
  return R.pipe(R.keys, R.head)(fieldConfig)
}

function lastItem(array) {
  return R.last(array)
}

// uses the value on object2 if it key exists on both
function mergeWithRight(object1, object2) {
  return R.mergeDeepRight(object1, object2)
}

function isEmpty(item) {
  return R.isEmpty(item) || R.isNil(item)
}

function getWhereKeyLike(url, roleList) {
  const stringIncludesKey = (value, key) => {
    const regExp = new RegExp(`^${key}$`, 'i')
    return regExp.test(url)
    // return lowerCaseString.includes(key.toLowerCase())
  }

  return R.pipe(R.pickBy(stringIncludesKey), R.values)(roleList)[0]
}

function replace(array, toReplace, newElement) {
  return array.filter(o => o !== toReplace).concat(newElement)
}

function groupBy(array, groupByProperty) {
  return R.groupBy(R.prop(groupByProperty), array)
}

function isFirstVisit(res) {
  return res.locals.formObject ? !res.locals.formObject.socProfile : true
}

function inProgress(dbRecord) {
  // Note cancelled rows are invisible
  return dbRecord && dbRecord.status && dbRecord.status !== Status.APPROVED.name
}

function extractNextReviewDate(details) {
  const catRecord = details && details.assessments && details.assessments.find(a => a.assessmentCode === 'CATEGORY')
  return catRecord && catRecord.nextReviewDate
}
