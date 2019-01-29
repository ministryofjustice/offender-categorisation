const path = require('path')
const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/functionalHelpers')
const { properCaseName } = require('../utils/utils.js')
const moment = require('moment')
const { sortByDateTime } = require('./offenderSort.js')

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

module.exports = function createOffendersService(nomisClientBuilder, formService) {
  async function getUncategorisedOffenders(token, agencyId, user) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const uncategorisedResult = await nomisClient.getUncategorisedOffenders(agencyId)

      if (isNilOrEmpty(uncategorisedResult)) {
        logger.info(`No uncategorised offenders found for ${agencyId}`)
        return []
      }

      const bookingIds = uncategorisedResult.map(o => o.bookingId)

      const sentenceDates = await nomisClient.getSentenceDatesForOffenders(bookingIds)

      const sentenceMap = sentenceDates
        .filter(s => s.sentenceDetail.sentenceStartDate) // the endpoint returns records for offenders without sentences
        .map(s => {
          const { sentenceDetail } = s
          return { bookingId: sentenceDetail.bookingId, sentenceDate: sentenceDetail.sentenceStartDate }
        })

      const decoratedResults = await Promise.all(
        uncategorisedResult
          .filter(o => sentenceMap.find(s => s.bookingId === o.bookingId)) // filter out offenders without sentence
          .map(async o => ({
            ...o,
            displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
            ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
            ...(await decorateWithCategorisationData(o, user, nomisClient)),
          }))
      )

      const offenders = decoratedResults.sort((a, b) => sortByDateTime(a.dateRequired, b.dateRequired)).reverse()

      return offenders
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  function buildSentenceData(sentenceDate) {
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')
    const actualDays = get10BusinessDays(sentenceDateMoment)
    const dateRequired = sentenceDateMoment.add(actualDays, 'day').format('YYYY-MM-DD')
    return { daysSinceSentence, dateRequired, sentenceDate }
  }

  async function decorateWithCategorisationData(offender, user, nomisClient) {
    const categorisation = await formService.getCategorisationRecord(offender.bookingId)
    let statusText
    if (categorisation.status) {
      statusText = statusTextDisplay(categorisation.status)
      logger.debug(`retrieving status ${categorisation.status} for booking id ${offender.bookingId}`)
      if (categorisation.assigned_user_id && categorisation.status === 'STARTED') {
        if (categorisation.assigned_user_id !== user.username) {
          // need to retrieve name details for non-current user
          try {
            const assignedUser = await nomisClient.getUserByUserId(categorisation.assigned_user_id)
            statusText += ` (${properCaseName(assignedUser.firstName)} ${properCaseName(assignedUser.lastName)})`
          } catch (error) {
            logger.warn(`No assigned user details found for  ${categorisation.assigned_user_id}`)
          }
        } else {
          statusText += ` (${properCaseName(user.firstName)} ${properCaseName(user.lastName)})`
        }
      }
      return { displayStatus: `${statusText}`, assignedUserId: categorisation.assignedUserId }
    }
    statusText = statusTextDisplay(offender.status)
    return { displayStatus: `${statusText}` }
  }

  const statusTextDisplay = input => {
    switch (input) {
      case 'UNCATEGORISED':
        return 'Not categorised'
      case 'AWAITING_APPROVAL':
        return 'Awaiting approval'
      case 'STARTED':
        return 'Started'
      default:
        return 'Unknown status'
    }
  }

  async function getOffenderDetails(token, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const result = await nomisClient.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const sentence = await nomisClient.getSentenceDetails(bookingId)
      const offence = await nomisClient.getMainOffence(bookingId)

      const displayName = {
        displayName: `${properCaseName(result.lastName)}, ${properCaseName(result.firstName)}`,
      }

      return { ...result, ...displayName, sentence, offence }
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

  return {
    getUncategorisedOffenders,
    getOffenderDetails,
    getImage,
    getCategoryHistory: getCatAInformation,
    // just for tests:
    buildSentenceData,
  }
}
