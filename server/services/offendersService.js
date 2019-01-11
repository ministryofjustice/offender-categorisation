const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/functionalHelpers')
const { properCaseName } = require('../utils/utils.js')
const moment = require('moment')

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

      const sentenceMap = sentenceDates.map(s => {
        const { sentenceDetail } = s
        return { bookingId: sentenceDetail.bookingId, sentenceDate: sentenceDetail.sentenceStartDate }
      })

      const offenders = uncategorisedResult
        .filter(o => sentenceMap.find(s => s.bookingId === o.bookingId)) // filter out offenders without sentence
        .map(o => ({
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
        }))

      return offenders
    } catch (error) {
      logger.error('Error during getUncategorisedOffenders: ', error.stack)
      throw error
    }
  }

  function buildSentenceData(sentenceDate) {
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')
    const dateRequired = sentenceDateMoment.add(10, 'day').format('YYYY-MM-DD')
    return { daysSinceSentence, dateRequired, sentenceDate }
  }

  return { getUncategorisedOffenders }
}
