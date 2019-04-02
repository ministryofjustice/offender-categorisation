const path = require('path')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')
const { isNilOrEmpty } = require('../utils/functionalHelpers')
const { properCaseName } = require('../utils/utils.js')
const moment = require('moment')
const { sortByDateTimeDesc } = require('./offenderSort.js')

const dirname = process.cwd()

const SATURDAY = 6
const SUNDAY = 0
const SUNDAY2 = 7

function isCatA(c) {
  return c.classificationCode === 'A' || c.classificationCode === 'H' || c.classificationCode === 'P'
}

function getYear(isoDate) {
  return isoDate && isoDate.substring(0, 4)
}

function get10BusinessDays(from) {
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

function plural(value) {
  return value > 1 ? 's' : ''
}

function formatValue(value, label) {
  return value > 0 ? `${value} ${label}${plural(value)}, ` : ''
}

function formatLength(sentenceTerms) {
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

async function getSentenceMap(uncategorisedResult, nomisClient) {
  const bookingIds = uncategorisedResult.map(o => o.bookingId)

  const sentenceDates = await nomisClient.getSentenceDatesForOffenders(bookingIds)

  const sentenceMap = sentenceDates
    .filter(s => s.sentenceDetail.sentenceStartDate) // the endpoint returns records for offenders without sentences
    .map(s => {
      const { sentenceDetail } = s
      return { bookingId: sentenceDetail.bookingId, sentenceDate: sentenceDetail.sentenceStartDate }
    })
  return sentenceMap
}

module.exports = function createOffendersService(nomisClientBuilder, formService) {
  async function getUncategorisedOffenders(token, agencyId, user) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const uncategorisedResult = await nomisClient.getUncategorisedOffenders(agencyId)

      if (isNilOrEmpty(uncategorisedResult)) {
        logger.info(`No uncategorised offenders found for ${agencyId}`)
        return []
      }
      const sentenceMap = await getSentenceMap(uncategorisedResult, nomisClient)

      const decoratedResults = await Promise.all(
        uncategorisedResult
          .filter(o => sentenceMap.find(s => s.bookingId === o.bookingId)) // filter out offenders without sentence
          .map(async o => {
            const dbRecord = await formService.getCategorisationRecord(o.bookingId)
            return {
              ...o,
              displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
              ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
              ...(await decorateWithCategorisationData(o, user, nomisClient, dbRecord)),
            }
          })
      )

      return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  async function getCategorisedOffenders(token, agencyId, user) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const categorised = await nomisClient.getCategorisedOffenders(agencyId)
      const categorisedWithDbRecord = (await Promise.all(
        categorised.map(async s => {
          const dbRecord = await formService.getCategorisationRecord(s.bookingId)
          return {
            ...s,
            dbRecord,
          }
        })
      )).filter(s => s.dbRecord.booking_id) // discard records that do not have a categorisation record (categorised by PNOMIS)

      const decoratedResults = await Promise.all(
        categorisedWithDbRecord.map(async o => {
          const approvalMoment = moment(o.approvalDate, 'YYYY-MM-DD')
          return {
            ...o,
            ...(await decorateWithCategorisationData(o, user, nomisClient, o.dbRecord)),
            displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
            displayApprovalDate: approvalMoment.format('DD/MM/YYYY'),
            displayCategoriserName: `${properCaseName(o.categoriserLastName)}, ${properCaseName(
              o.categoriserFirstName
            )}`,
            displayApproverName: `${properCaseName(o.approverLastName)}, ${properCaseName(o.approverFirstName)}`,
          }
        })
      )

      return decoratedResults.sort(a => sortByDateTimeDesc(a.displayApprovalDate)).reverse()
    } catch (error) {
      logger.error(error, 'Error during getCategorisedOffenders')
      throw error
    }
  }

  async function getUnapprovedOffenders(token, agencyId) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const uncategorisedResult = (await nomisClient.getUncategorisedOffenders(agencyId)).filter(
        s => s.status === Status.AWAITING_APPROVAL.name // the status coming back from nomis
      )

      const unapprovedWithDbRecord = await Promise.all(
        uncategorisedResult.map(async s => {
          const dbRecord = await formService.getCategorisationRecord(s.bookingId)
          return {
            ...s,
            dbRecord,
          }
        })
      )

      // remove any sent back to categoriser records
      const unapprovedOffenders = unapprovedWithDbRecord.filter(o => o.dbRecord.status !== Status.SUPERVISOR_BACK.name)

      if (isNilOrEmpty(unapprovedOffenders)) {
        logger.info(`No unapproved offenders found for ${agencyId}`)
        return []
      }

      const sentenceMap = await getSentenceMap(uncategorisedResult, nomisClient)

      const decoratedResults = await Promise.all(
        unapprovedOffenders.map(o => {
          const sentencedOffender = sentenceMap.find(s => s.bookingId === o.bookingId)
          const sentenceData = sentencedOffender ? buildSentenceData(sentencedOffender.sentenceDate) : {}
          return {
            ...o,
            displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
            categoriserDisplayName: `${properCaseName(o.categoriserFirstName)} ${properCaseName(
              o.categoriserLastName
            )}`,
            dbRecordExists: !!o.dbRecord.booking_id,
            ...sentenceData,
          }
        })
      )

      return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
    } catch (error) {
      logger.error(error, 'Error during getUnapprovedOffenders')
      throw error
    }
  }

  async function getReferredOffenders(token, agencyId, user) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const allUncategorised = await nomisClient.getUncategorisedOffenders(agencyId)
      const referredResult = (await Promise.all(
        allUncategorised.map(async s => {
          const dbRecord = await formService.getCategorisationRecord(s.bookingId)
          return {
            ...s,
            dbRecord,
            referredBy: dbRecord.referred_by,
            dbStatus: dbRecord.status,
          }
        })
      )).filter(s => s.dbStatus === Status.SECURITY_AUTO.name || s.dbStatus === Status.SECURITY_MANUAL.name)

      if (isNilOrEmpty(referredResult)) {
        logger.info(`No referred offenders found for ${agencyId}`)
        return []
      }

      const sentenceMap = await getSentenceMap(referredResult, nomisClient)

      const decoratedResults = await Promise.all(
        referredResult
          .filter(o => sentenceMap.find(s => s.bookingId === o.bookingId)) // filter out offenders without sentence
          .map(async o => ({
            ...o,
            ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
            ...(await decorateWithCategorisationData(o, user, nomisClient, o.dbRecord)),
            displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          }))
      )

      return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
    } catch (error) {
      logger.error(error, 'Error during getReferredOffenders')
      throw error
    }
  }

  function buildSentenceData(sentenceDate) {
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')
    const actualDays = get10BusinessDays(sentenceDateMoment)
    const dateRequired = sentenceDateMoment.add(actualDays, 'day').format('DD/MM/YYYY')
    return { daysSinceSentence, dateRequired, sentenceDate }
  }

  async function decorateWithCategorisationData(offender, user, nomisClient, categorisation) {
    let statusText
    if (categorisation.status) {
      statusText = statusTextDisplay(categorisation.status)
      logger.debug(`retrieving status ${categorisation.status} for booking id ${offender.bookingId}`)
      let referrer
      if (categorisation.assigned_user_id && categorisation.status === Status.STARTED.name) {
        if (categorisation.assigned_user_id !== user.username) {
          // need to retrieve name details for non-current user
          try {
            const assignedUser = await nomisClient.getUserByUserId(categorisation.assigned_user_id)
            statusText += ` (${properCaseName(assignedUser.firstName)} ${properCaseName(assignedUser.lastName)})`
          } catch (error) {
            logger.warn(`No assigned user details found for ${categorisation.assigned_user_id}`)
          }
        } else {
          statusText += ` (${properCaseName(user.firstName)} ${properCaseName(user.lastName)})`
        }
      } else if (
        categorisation.referred_by &&
        (categorisation.status === Status.SECURITY_AUTO.name || categorisation.status === Status.SECURITY_MANUAL.name)
      ) {
        // need to retrieve name details for categoriser user
        try {
          referrer = await nomisClient.getUserByUserId(categorisation.referred_by)
        } catch (error) {
          logger.warn(`No user details found for ${categorisation.referred_by}`)
        }
      }
      return {
        dbRecordExists: true,
        displayStatus: statusText,
        assignedUserId: categorisation.assigned_user_id,
        referredBy: referrer && `${properCaseName(referrer.firstName)} ${properCaseName(referrer.lastName)}`,
      }
    }
    statusText = statusTextDisplay(offender.status)
    return { displayStatus: statusText }
  }

  const statusTextDisplay = input => (Status[input] ? Status[input].value : '')

  async function getOffenderDetails(token, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const result = await nomisClient.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const [sentenceDetails, sentenceTerms, offence] = await Promise.all([
        nomisClient.getSentenceDetails(bookingId),
        nomisClient.getSentenceTerms(bookingId),
        nomisClient.getMainOffence(bookingId),
      ])

      const displayName = {
        displayName: `${properCaseName(result.lastName)}, ${properCaseName(result.firstName)}`,
      }

      return {
        ...result,
        ...displayName,
        sentence: { ...sentenceDetails, length: formatLength(sentenceTerms) },
        offence,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  function enableCaching(res) {
    res.setHeader('Cache-Control', 'max-age=3600')
    const expirationDate = moment().add(1, 'h') // one hour from now
    const rfc822Date = moment(expirationDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ')
    res.setHeader('Expires', rfc822Date)
    // Undo helmet noCache:
    res.removeHeader('Surrogate-Control')
    res.removeHeader('Pragma')
  }

  async function getImage(token, imageId, res) {
    const nomisClient = nomisClientBuilder(token)
    const placeHolder = () => path.join(dirname, './assets/images/image-missing.png')
    enableCaching(res)

    if (!imageId || imageId === 'placeholder') {
      res.sendFile(placeHolder())
    } else {
      try {
        const data = await nomisClient.getImageData(imageId)
        data.pipe(res)
        res.type('image/jpeg')
      } catch (error) {
        logger.error(error)
        res.sendFile(placeHolder())
      }
    }
  }

  async function getCatAInformation(token, offenderNo) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const categories = await nomisClient.getCategoryHistory(offenderNo)
      const mostRecentCatA = categories
        .slice()
        .reverse()
        .find(isCatA)

      let catAType = null
      let catAStartYear = null
      let catAEndYear = null
      let releaseYear = null
      let finalCat = null
      if (mostRecentCatA) {
        const categoriesForBooking = categories.filter(c => c.bookingId === mostRecentCatA.bookingId)
        catAType = mostRecentCatA.classificationCode
        catAStartYear = getYear(mostRecentCatA.assessmentDate)
        const catAIndex = categoriesForBooking.findIndex(isCatA)
        if (catAIndex < categoriesForBooking.length - 1) {
          catAEndYear = getYear(categoriesForBooking[catAIndex + 1].assessmentDate)
        }
        finalCat = categoriesForBooking[categoriesForBooking.length - 1].classification
        const sentences = await nomisClient.getSentenceHistory(offenderNo)
        const catASentence = sentences.find(s => s.sentenceDetail.bookingId === mostRecentCatA.bookingId)
        if (catASentence) {
          if (catAIndex === categoriesForBooking.length - 1) {
            // Cat A was the last, or only categorisation for this sentence (should not happen!)
            catAEndYear = getYear(catASentence.sentenceDetail.releaseDate)
            logger.warn(`Found sentence with ends as Cat A, bookingId=${mostRecentCatA.bookingId}`)
          }
          releaseYear = getYear(catASentence.sentenceDetail.releaseDate)
        }
      }

      return { catAType, catAStartYear, catAEndYear, releaseYear, finalCat }
    } catch (error) {
      logger.error(error, 'Error during getCatAInformation')
      throw error
    }
  }

  async function createInitialCategorisation(token, bookingId, form) {
    const category = form.overriddenCategory || form.suggestedCategory
    const comment = form.overriddenCategoryText || ''
    const nomisClient = nomisClientBuilder(token)
    try {
      await nomisClient.createInitialCategorisation({ bookingId, category, committee: 'Cat-tool', comment })
    } catch (error) {
      logger.error(error, 'Error during createInitialCategorisation')
      throw error
    }
  }

  async function createSupervisorApproval(token, bookingId, form) {
    const category = form.supervisorOverriddenCategory || form.proposedCategory
    const comment = form.supervisorOverriddenCategoryText || ''
    const nomisClient = nomisClientBuilder(token)
    try {
      await nomisClient.createSupervisorApproval({
        bookingId,
        category,
        evaluationDate: moment().format('YYYY-MM-DD'),
        reviewSupLevelText: comment,
        reviewCommitteeCode: 'REVIEW',
      })
    } catch (error) {
      logger.error(error, 'Error during createSupervisorApproval')
      throw error
    }
  }

  async function getOffenceHistory(token, offenderNo) {
    const nomisClient = nomisClientBuilder(token)
    const result = await nomisClient.getOffenceHistory(offenderNo)
    return result
  }

  return {
    getUncategorisedOffenders,
    getUnapprovedOffenders,
    getReferredOffenders,
    getOffenderDetails,
    getImage,
    getCatAInformation,
    getOffenceHistory,
    // just for tests:
    buildSentenceData,
    createInitialCategorisation,
    createSupervisorApproval,
    getCategorisedOffenders,
  }
}
