import * as R from 'ramda'
import Status from './statusEnum'

export default {
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
  addSocProfile,
}

export function isNilOrEmpty(item) {
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
  // @ts-ignore
  return R.groupBy(R.prop(groupByProperty), array)
}

function isFirstVisit(res) {
  return res.locals.formObject ? !res.locals.formObject.socProfile : true
}

export function inProgress(dbRecord) {
  // Note cancelled rows are invisible
  return dbRecord && dbRecord.status && dbRecord.status !== Status.APPROVED.name
}

export function extractNextReviewDate(details) {
  const catRecord = details && details.assessments && details.assessments.find(a => a.assessmentCode === 'CATEGORY')
  return catRecord && catRecord.nextReviewDate
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
  let { status } = categorisationRecord
  // only load the soc profile once - then it is saved against the record
  if (isFirstVisit(res)) {
    const socProfile = await riskProfilerService.getSecurityProfile(details.offenderNo, res.locals)
    const extremismProfile = await riskProfilerService.getExtremismProfile(
      details.offenderNo,
      res.locals,
      false // don't yet have the answer to this question - will be populated correctly in the review route
    )

    await formService.mergeRiskProfileData(bookingId, { socProfile, extremismProfile }, transactionalDbClient)

    status = await formService.referToSecurityIfRiskAssessed(
      bookingId,
      req.user.username,
      socProfile,
      extremismProfile,
      status,
      transactionalDbClient
    )
  }

  await formService.referToSecurityIfFlagged(bookingId, details.offenderNo, status, transactionalDbClient)

  return formService.getCategorisationRecord(bookingId, transactionalDbClient)
}
