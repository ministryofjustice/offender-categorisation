const path = require('path')
const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/functionalHelpers')
const { properCaseName } = require('../utils/utils.js')
const moment = require('moment')
const { sortByDateTime } = require('./offenderSort.js')

const dirname = process.cwd()

module.exports = function createOffendersService(nomisClientBuilder) {
  async function getUncategorisedOffenders(token, agencyId) {
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

      const offenders = uncategorisedResult
        .filter(o => sentenceMap.find(s => s.bookingId === o.bookingId)) // filter out offenders without sentence
        .map(o => ({
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          displayStatus: statusText(o.status),
          ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
        }))
        .sort((a, b) => sortByDateTime(a.dateRequired, b.dateRequired))
        .reverse()

      return offenders
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  function buildSentenceData(sentenceDate) {
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')
    const dateRequired = sentenceDateMoment.add(10, 'day').format('YYYY-MM-DD')
    return { daysSinceSentence, dateRequired, sentenceDate }
  }

  const statusText = input => {
    switch (input) {
      case 'UNCATEGORISED':
        return 'Not categorised'
      case 'AWAITING_APPROVAL':
        return 'Awaiting approval'
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

      return { ...result, sentence, offence }
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

  return { getUncategorisedOffenders, getOffenderDetails, getImage }
}
