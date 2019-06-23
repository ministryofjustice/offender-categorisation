const path = require('path')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
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

async function getSentenceMap(offenderList, nomisClient) {
  const bookingIds = offenderList.map(o => o.bookingId)

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
  async function getUncategorisedOffenders(token, agencyId, user, transactionalDbClient) {
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
            const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
            if (dbRecord.catType === 'RECAT') {
              return null
            }
            return {
              ...o,
              displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
              ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
              ...(await decorateWithCategorisationData(o, user, nomisClient, dbRecord)),
            }
          })
      )

      return decoratedResults
        .filter(o => o) // ignore recats (set to null)
        .sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  async function getCategorisedOffenders(token, agencyId, user, catType, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const categorisedFromDB = await formService.getCategorisedOffenders(agencyId, catType, transactionalDbClient)
      if (!isNilOrEmpty(categorisedFromDB)) {
        const categorisedFromElite = await nomisClient.getCategorisedOffenders(
          agencyId,
          categorisedFromDB.map(c => c.bookingId)
        )

        const decoratedResults = await Promise.all(
          categorisedFromElite.map(async o => {
            const approvalMoment = moment(o.approvalDate, 'YYYY-MM-DD')
            const dbRecord = categorisedFromDB.find(record => record.bookingId === o.bookingId)
            return {
              ...o,
              dbRecord,
              ...(await decorateWithCategorisationData(o, user, nomisClient, dbRecord)),
              displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
              displayApprovalDate: approvalMoment.format('DD/MM/YYYY'),
              displayCategoriserName: `${properCaseName(o.categoriserLastName)}, ${properCaseName(
                o.categoriserFirstName
              )}`,
              displayApproverName: `${properCaseName(o.approverLastName)}, ${properCaseName(o.approverFirstName)}`,
              catTypeDisplay: CatType[dbRecord.catType].value,
            }
          })
        )

        return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.displayApprovalDate, b.displayApprovalDate))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getCategorisedOffenders')
      throw error
    }
  }

  async function getReferredOffenders(token, agencyId, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const securityReferredFromDB = await formService.getSecurityReferredOffenders(agencyId, transactionalDbClient)

      if (!isNilOrEmpty(securityReferredFromDB)) {
        const sentenceMap = await getSentenceMap(securityReferredFromDB, nomisClient)

        const offenderDetailsFromElite = await nomisClient.getOffenderDetailList(
          agencyId,
          securityReferredFromDB.map(c => c.bookingId)
        )

        const userDetailFromElite = await nomisClient.getUserDetailList(
          securityReferredFromDB.map(c => c.securityReferredBy)
        )

        const decoratedResults = securityReferredFromDB.map(o => {
          const offenderDetail = offenderDetailsFromElite.find(record => record.bookingId === o.bookingId)

          let securityReferredBy
          if (o.securityReferredBy) {
            const referrer = userDetailFromElite.find(record => record.username === o.securityReferredBy)
            securityReferredBy = referrer
              ? `${properCaseName(referrer.firstName)} ${properCaseName(referrer.lastName)}`
              : o.securityReferredBy
          }

          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            securityReferredBy,
            ...buildSentenceData(sentenceMap.find(s => s.bookingId === o.bookingId).sentenceDate),
            catTypeDisplay: CatType[o.catType].value,
          }
        })

        return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getReferredOffenders')
      throw error
    }
  }

  async function getSecurityReviewedOffenders(token, agencyId, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const securityReviewedFromDB = await formService.getSecurityReviewedOffenders(agencyId, transactionalDbClient)
      if (!isNilOrEmpty(securityReviewedFromDB)) {
        const offenderDetailsFromElite = await nomisClient.getOffenderDetailList(
          agencyId,
          securityReviewedFromDB.map(c => c.bookingId)
        )

        const userDetailFromElite = await nomisClient.getUserDetailList(
          securityReviewedFromDB.map(c => c.securityReviewedBy)
        )

        const decoratedResults = securityReviewedFromDB.map(o => {
          const reviewedMoment = moment(o.securityReviewedDate, 'YYYY-MM-DD')
          const offenderDetail = offenderDetailsFromElite.find(record => record.bookingId === o.bookingId)
          const userDetail = userDetailFromElite.find(record => record.username === o.securityReviewedBy)
          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            displayReviewedDate: reviewedMoment.format('DD/MM/YYYY'),
            displayReviewerName: `${properCaseName(userDetail.lastName)}, ${properCaseName(userDetail.firstName)}`,
            catTypeDisplay: CatType[o.catType].value,
          }
        })

        return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.displayReviewedDate, b.displayReviewedDate))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getSecurityReviewedOffenders')
      throw error
    }
  }

  async function getUnapprovedOffenders(token, agencyId, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const uncategorisedResult = (await nomisClient.getUncategorisedOffenders(agencyId)).filter(
        s => s.status === Status.AWAITING_APPROVAL.name // the status coming back from nomis
      )

      const unapprovedWithDbRecord = await Promise.all(
        uncategorisedResult.map(async s => {
          const dbRecord = await formService.getCategorisationRecord(s.bookingId, transactionalDbClient)
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

      const decoratedResults = unapprovedOffenders.map(o => {
        const sentencedOffender = sentenceMap.find(s => s.bookingId === o.bookingId)
        const sentenceData = sentencedOffender ? buildSentenceData(sentencedOffender.sentenceDate) : {}
        const dbRecordExists = !!o.dbRecord.bookingId
        return {
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          categoriserDisplayName: `${properCaseName(o.categoriserFirstName)} ${properCaseName(o.categoriserLastName)}`,
          dbRecordExists,
          catType: dbRecordExists ? CatType[o.dbRecord.catType].value : '',
          ...sentenceData,
        }
      })

      return decoratedResults.sort((a, b) => sortByDateTimeDesc(a.dateRequired, b.dateRequired))
    } catch (error) {
      logger.error(error, 'Error during getUnapprovedOffenders')
      throw error
    }
  }

  async function getRecategoriseOffenders(token, agencyId, user, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const rawResult = await nomisClient.getRecategoriseOffenders(agencyId)

      if (isNilOrEmpty(rawResult)) {
        logger.info(`No recat offenders found for ${agencyId}`)
        return []
      }

      const decoratedResults = await Promise.all(
        rawResult.map(async o => {
          const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
          if (dbRecord.catType === 'INITIAL') {
            return null
          }
          const decorated = await decorateWithCategorisationData(o, user, nomisClient, dbRecord)
          return {
            ...o,
            displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
            displayStatus: decorated.displayStatus || 'Not started',
            reason: 'Review due',
            dbRecordExists: decorated.dbRecordExists,
          }
        })
      )
      // TODO: append others in the db with recat started - these will be manual reviews (or possibly risk level changes?)
      // Also approaching age 21
      // They wont have a due date shown (it would be after the cutoff)

      return decoratedResults.filter(o => o) // ignore initial cats (set to null)
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
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
      if (categorisation.assignedUserId && categorisation.status === Status.STARTED.name) {
        if (categorisation.assignedUserId !== user.username) {
          // need to retrieve name details for non-current user
          try {
            const assignedUser = await nomisClient.getUserByUserId(categorisation.assignedUserId)
            statusText += ` (${properCaseName(assignedUser.firstName)} ${properCaseName(assignedUser.lastName)})`
          } catch (error) {
            logger.warn(error, `No assigned user details found for ${categorisation.assignedUserId}`)
          }
        } else {
          statusText += ` (${properCaseName(user.firstName)} ${properCaseName(user.lastName)})`
        }
      }
      return {
        dbRecordExists: true,
        displayStatus: statusText,
        assignedUserId: categorisation.assignedUserId,
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
        sentence: {
          ...sentenceDetails,
          list: sentenceTerms,
          indeterminate: !!sentenceTerms.find(e => e.lifeSentence),
        },
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

  async function getPrisonerBackground(token, offenderNo) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const currentCats = await nomisClient.getCategoryHistory(offenderNo)

      const decoratedCats = await Promise.all(
        currentCats.map(async o => {
          const description = await getOptionalAssessmentAgencyDescription(nomisClient, o.assessmentAgencyId)
          const assessmentMoment = moment(o.assessmentDate, 'YYYY-MM-DD')
          return {
            ...o,
            agencyDescription: description,
            assessmentDateDisplay: assessmentMoment.format('DD/MM/YYYY'),
          }
        })
      )

      return decoratedCats
    } catch (error) {
      logger.error(error, 'Error during getPrisonerBackground')
      throw error
    }
  }

  async function getOptionalAssessmentAgencyDescription(nomisClient, agencyId) {
    if (agencyId) {
      const agency = await nomisClient.getAgencyDetail(agencyId)
      return agency.description
    }
    return ''
  }

  async function createInitialCategorisation({
    token,
    bookingId,
    overriddenCategory,
    suggestedCategory,
    overriddenCategoryText,
    nextReviewDate,
  }) {
    const category = overriddenCategory || suggestedCategory
    const comment = overriddenCategoryText || ''
    const nomisClient = nomisClientBuilder(token)
    const nextReviewDateConverted = nextReviewDate && moment(nextReviewDate, 'DD/MM/YYYY').format('YYYY-MM-DD')
    try {
      await nomisClient.createInitialCategorisation({
        bookingId,
        category,
        committee: 'Cat-tool',
        comment,
        nextReviewDate: nextReviewDateConverted,
      })
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

  async function isRecat(token, bookingId, transactionalDbClient) {
    // Decide whether INITIAL or RECAT.
    // If there is a local record then if that is APPROVED it is a RECAT,
    //   otherwise its the type of the existing (continue existing)
    // If no local record, get cat from nomis. if missing or UXZ it is INITIAL, otherwise RECAT.
    const localRecord = formService.getCategorisationRecord(bookingId, transactionalDbClient)
    if (localRecord.status) {
      return localRecord.status === Status.APPROVED.name || localRecord.catType === CatType.RECAT.name
    }
    const nomisClient = nomisClientBuilder(token)
    try {
      const cat = await nomisClient.getCategory(bookingId)
      return cat.classificationCode && !/[UXZ]/.test(cat.classificationCode)
    } catch (error) {
      return false
    }
  }

  return {
    getUncategorisedOffenders,
    getUnapprovedOffenders,
    getReferredOffenders,
    getRecategoriseOffenders,
    getOffenderDetails,
    getImage,
    getCatAInformation,
    getOffenceHistory,
    isRecat,
    // just for tests:
    buildSentenceData,
    createInitialCategorisation,
    createSupervisorApproval,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getPrisonerBackground,
  }
}
