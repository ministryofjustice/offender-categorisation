const R = require('ramda')

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
  addSocProfile,
}

function isNilOrEmpty(item) {
  return R.isEmpty(item) || R.isNil(item)
}

function getFieldDetail(fieldPath, fieldConfig) {
  return R.pipe(
    R.values,
    R.head,
    R.path(fieldPath)
  )(fieldConfig)
}

function getFieldName(fieldConfig) {
  return R.pipe(
    R.keys,
    R.head
  )(fieldConfig)
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

  return R.pipe(
    R.pickBy(stringIncludesKey),
    R.values
  )(roleList)[0]
}

function replace(array, toReplace, newElement) {
  return array.filter(o => o !== toReplace).concat(newElement)
}

function groupBy(array, groupByProperty) {
  return R.groupBy(R.prop(groupByProperty), array)
}

async function addSocProfile({
  res,
  riskProfilerService,
  details,
  formService,
  bookingId,
  transactionalDbClient,
  req,
  categorisationRecord,
}) {
  // only load the soc profile once - then it is saved against the record
  if (res.locals.formObject.socProfile) {
    return categorisationRecord
  }
  const socProfile = await riskProfilerService.getSecurityProfile(details.offenderNo, res.locals.user.username)

  await formService.mergeRiskProfileData(bookingId, { socProfile }, transactionalDbClient)

  await formService.referToSecurityIfRiskAssessed(
    bookingId,
    req.user.username,
    socProfile,
    categorisationRecord.status,
    transactionalDbClient
  )
  return formService.getCategorisationRecord(bookingId, transactionalDbClient)
}
