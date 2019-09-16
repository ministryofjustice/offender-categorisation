const path = require('path')
const moment = require('moment')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const ReviewReason = require('../utils/reviewReasonEnum')
const { isNilOrEmpty } = require('../utils/functionalHelpers')
const { properCaseName, dateConverter, get10BusinessDays } = require('../utils/utils.js')
const { sortByDateTime, sortByStatus } = require('./offenderSort.js')
const config = require('../config')
const riskChangeHelper = require('../utils/riskChange')
const RiskChangeStatus = require('../utils/riskChangeStatusEnum')

const dirname = process.cwd()

const extractNextReviewDate = details => {
  const catRecord = details && details.assessments && details.assessments.find(a => a.assessmentCode === 'CATEGORY')
  return catRecord && catRecord.nextReviewDate
}

function isCatA(c) {
  return c.classificationCode === 'A' || c.classificationCode === 'H' || c.classificationCode === 'P'
}

function getYear(isoDate) {
  return isoDate && isoDate.substring(0, 4)
}

function isOverdue(dbDate) {
  const date = moment(dbDate, 'YYYY-MM-DD')
  return date.isBefore(moment(0, 'HH'))
}

async function getSentenceMap(offenderList, nomisClient) {
  const bookingIds = offenderList
    .filter(o => !o.dbRecord || !o.dbRecord.catType || o.dbRecord.catType === CatType.INITIAL.name)
    .map(o => o.bookingId)

  const sentenceDates = await nomisClient.getSentenceDatesForOffenders(bookingIds)

  return new Map(
    sentenceDates
      .filter(s => s.sentenceDetail.sentenceStartDate) // the endpoint returns records for offenders without sentences
      .map(s => {
        const { sentenceDetail } = s
        return [sentenceDetail.bookingId, { sentenceDate: sentenceDetail.sentenceStartDate }]
      })
  )
}

function localStatusIsInconstentWithNomisAwaitingApproval(dbRecord) {
  return (
    !!dbRecord &&
    dbRecord.status !== Status.AWAITING_APPROVAL.name &&
    dbRecord.status !== Status.SUPERVISOR_BACK.name &&
    dbRecord.status !== Status.SECURITY_BACK.name &&
    dbRecord.status !== Status.SECURITY_MANUAL.name
  )
}

function unwanted(dbRecord) {
  return (
    // Initial cat in progress
    dbRecord.catType === CatType.INITIAL.name && dbRecord.status !== Status.APPROVED.name
  )
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
          .filter(o => sentenceMap.get(o.bookingId)) // filter out offenders without sentence
          .map(async o => {
            const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
            if (dbRecord.catType === 'RECAT') {
              return null
            }

            const nomisStatusAwaitingApproval = o.status === Status.AWAITING_APPROVAL.name
            const nomisStatusUncategorised = o.status === Status.UNCATEGORISED.name

            const inconsistent =
              (nomisStatusAwaitingApproval && localStatusIsInconstentWithNomisAwaitingApproval(dbRecord)) ||
              (nomisStatusUncategorised &&
                (dbRecord.status === Status.AWAITING_APPROVAL.name || dbRecord.status === Status.APPROVED.name))

            const row = {
              ...o,
              displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
              ...buildSentenceData(sentenceMap.get(o.bookingId).sentenceDate),
              ...(await decorateWithCategorisationData(o, user, nomisClient, dbRecord)),
              pnomis: inconsistent || (nomisStatusAwaitingApproval && !dbRecord.status),
            }
            if (inconsistent) {
              logger.warn(
                `getUncategorisedOffenders: Detected status inconsistency for booking id=${row.bookingId}, offenderNo=${row.offenderNo}, Nomis status=${o.status}, PG status=${dbRecord.status}`
              )
            }
            return row
          })
      )

      return decoratedResults
        .filter(o => o) // ignore recats (which were set to null)
        .sort((a, b) => {
          const status = sortByStatus(b.dbStatus, a.dbStatus)
          return status === 0 ? sortByDateTime(b.dateRequired, a.dateRequired) : status
        })
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  const matchEliteAndDBCategorisations = (categorisedFromElite, categorisedFromDB) =>
    categorisedFromDB.map(dbRecord => {
      const elite = categorisedFromElite.find(
        record => record.bookingId === dbRecord.bookingId && record.assessmentSeq === dbRecord.nomisSeq
      )
      if (elite) {
        return {
          dbRecord,
          ...elite,
        }
      }
      logger.warn(
        `matchEliteAndDBCategorisations: Found database record with no elite record, bookingId=${dbRecord.bookingId}, offenderNo=${dbRecord.offenderNo}, nomisSeq=${dbRecord.nomisSeq}`
      )
      return {
        dbRecord,
        bookingId: dbRecord.bookingId,
        offenderNo: dbRecord.offenderNo,
        approvalDate: dbRecord.approvalDate,
      }
    })

  async function getCategorisedOffenders(token, agencyId, user, catType, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const categorisedFromDB = await formService.getCategorisedOffenders(agencyId, catType, transactionalDbClient)
      if (!isNilOrEmpty(categorisedFromDB)) {
        const categorisedFromElite = await nomisClient.getCategorisedOffenders(
          agencyId,
          categorisedFromDB.map(c => c.bookingId)
        )

        const matchedCategorisations = matchEliteAndDBCategorisations(categorisedFromElite, categorisedFromDB)

        const decoratedResults = await Promise.all(
          matchedCategorisations.map(async o => ({
            ...o,
            ...(await decorateWithCategorisationData(o, user, nomisClient, o.dbRecord)),
            displayName: o.lastName && `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
            displayApprovalDate: dateConverter(o.approvalDate),
            displayCategoriserName:
              o.categoriserLastName &&
              `${properCaseName(o.categoriserLastName)}, ${properCaseName(o.categoriserFirstName)}`,
            displayApproverName:
              o.approverLastName && `${properCaseName(o.approverLastName)}, ${properCaseName(o.approverFirstName)}`,
            catTypeDisplay: CatType[o.dbRecord.catType].value,
          }))
        )

        return decoratedResults.sort((a, b) => sortByDateTime(a.displayApprovalDate, b.displayApprovalDate))
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
          securityReferredFromDB.map(c => c.offenderNo)
        )

        const userDetailFromElite = await nomisClient.getUserDetailList(
          securityReferredFromDB.map(c => c.securityReferredBy)
        )

        const decoratedResults = securityReferredFromDB.map(o => {
          const offenderDetail = offenderDetailsFromElite.find(record => record.offenderNo === o.offenderNo)

          let securityReferredBy
          if (o.securityReferredBy) {
            const referrer = userDetailFromElite.find(record => record.username === o.securityReferredBy)
            securityReferredBy = referrer
              ? `${properCaseName(referrer.firstName)} ${properCaseName(referrer.lastName)}`
              : o.securityReferredBy
          }
          const sentenceData = sentenceMap.get(o.bookingId)
          if (!sentenceData) {
            logger.error(
              `Found offender without sentence in security referred list: booking Id=${o.bookingId}, prison=${o.prisonId}`
            )
            return null
          }

          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            securityReferredBy,
            ...buildSentenceData(sentenceMap.get(o.bookingId).sentenceDate),
            catTypeDisplay: CatType[o.catType].value,
          }
        })

        // filter out offenders who no longer have a sentence (nomis change since referral)
        return decoratedResults.filter(o => o).sort((a, b) => sortByDateTime(b.dateRequired, a.dateRequired))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getReferredOffenders')
      throw error
    }
  }

  async function getRiskChanges(token, agencyId, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const changesFromDB = await formService.getRiskChanges(agencyId, transactionalDbClient)

      if (!isNilOrEmpty(changesFromDB)) {
        const offenderNos = changesFromDB.map(c => c.offenderNo)
        const [offenderDetailsFromElite, offenderCategorisationsFromElite] = await Promise.all([
          nomisClient.getOffenderDetailList(offenderNos),
          nomisClient.getLatestCategorisationForOffenders(offenderNos),
        ])

        const decoratedResults = changesFromDB.map(o => {
          const offenderDetail = offenderDetailsFromElite.find(record => record.offenderNo === o.offenderNo)
          const offenderCategorisation = offenderCategorisationsFromElite.find(
            record => record.offenderNo === o.offenderNo
          )
          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            bookingId: offenderCategorisation.bookingId,
            displayName:
              offenderDetail.lastName &&
              `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            displayNextReviewDate: dateConverter(offenderCategorisation.nextReviewDate),
            displayCreatedDate: dateConverter(o.raisedDate),
          }
        })

        return decoratedResults.sort((a, b) => sortByDateTime(a.displayCreatedDate, b.displayCreatedDate))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getRiskChanges')
      throw error
    }
  }

  async function getSecurityReviewedOffenders(token, agencyId, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const securityReviewedFromDB = await formService.getSecurityReviewedOffenders(agencyId, transactionalDbClient)
      if (!isNilOrEmpty(securityReviewedFromDB)) {
        const offenderDetailsFromElite = await nomisClient.getOffenderDetailList(
          securityReviewedFromDB.map(c => c.offenderNo)
        )

        const userDetailFromElite = await nomisClient.getUserDetailList(
          securityReviewedFromDB.map(c => c.securityReviewedBy)
        )

        const decoratedResults = securityReviewedFromDB.map(o => {
          const reviewedMoment = moment(o.securityReviewedDate, 'YYYY-MM-DD')
          const offenderDetail = offenderDetailsFromElite.find(record => record.offenderNo === o.offenderNo)
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

        return decoratedResults.sort((a, b) => sortByDateTime(a.displayReviewedDate, b.displayReviewedDate))
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
          return { ...s, dbRecord }
        })
      )

      // remove any sent back to categoriser records
      const unapprovedOffenders = unapprovedWithDbRecord.filter(
        o =>
          o.dbRecord.status !== Status.SUPERVISOR_BACK.name &&
          o.dbRecord.status !== Status.SECURITY_BACK.name &&
          o.dbRecord.status !== Status.SECURITY_MANUAL.name
      )

      if (isNilOrEmpty(unapprovedOffenders)) {
        logger.info(`getUnapprovedOffenders: No unapproved offenders found for ${agencyId}`)
        return []
      }

      const sentenceMap = await getSentenceMap(unapprovedOffenders, nomisClient)

      const decoratedResults = unapprovedOffenders.map(o => {
        const sentencedOffender = sentenceMap.get(o.bookingId)
        const sentenceData = sentencedOffender ? buildSentenceData(sentencedOffender.sentenceDate) : {}
        const dbRecordExists = !!o.dbRecord.bookingId
        const row = {
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          categoriserDisplayName: `${properCaseName(o.categoriserFirstName)} ${properCaseName(o.categoriserLastName)}`,
          dbRecordExists,
          catType: dbRecordExists ? CatType[o.dbRecord.catType].value : '',
          ...sentenceData,
          // Both the elite2 and the database record are the latest available for each booking so the nomis seq should always match.
          // If the database one is earlier, then a cat has been subsequently done in P-Nomis, so ‘PNOMIS’ should be shown.
          // If elite2 is earlier then it is out of date (somehow the insertion of a record failed earlier, and also the pre-existing record was also awaiting_approval).
          // ‘PNOMIS’ should be shown and a warning logged.
          pnomis:
            !(dbRecordExists && o.dbRecord.status === Status.AWAITING_APPROVAL.name) ||
            (dbRecordExists && o.dbRecord.nomisSeq !== o.assessmentSeq),
          nextReviewDate: o.dbRecord.catType === 'RECAT' || !dbRecordExists ? dateConverter(o.nextReviewDate) : null,
        }
        if (dbRecordExists && row.dbRecord.status !== Status.AWAITING_APPROVAL.name) {
          logger.warn(
            `getUnapprovedOffenders: Detected status inconsistency for booking id=${row.bookingId}, offenderNo=${row.offenderNo}, PG status=${row.dbRecord.status}`
          )
        }
        if (dbRecordExists && row.dbRecord.nomisSeq !== row.assessmentSeq) {
          logger.warn(
            `getUnapprovedOffenders: sequence mismatch for bookingId=${row.bookingId}, offenderNo=${row.offenderNo}, Nomis status=${o.status}, nomisSeq=${row.dbRecord.nomisSeq}, assessmentSeq=${row.assessmentSeq}`
          )
        }
        return row
      })

      return decoratedResults.sort((a, b) =>
        sortByDateTime(
          b.dateRequired ? b.dateRequired : b.nextReviewDate,
          a.dateRequired ? a.dateRequired : a.nextReviewDate
        )
      )
    } catch (error) {
      logger.error(error, 'Error during getUnapprovedOffenders')
      throw error
    }
  }

  async function getDueRecats(agencyId, user, nomisClient, transactionalDbClient) {
    const reviewTo = moment()
      .add(config.recatMarginMonths, 'months')
      .format('YYYY-MM-DD')

    const resultsReview = await nomisClient.getRecategoriseOffenders(agencyId, reviewTo)
    return Promise.all(
      resultsReview.map(async o => {
        const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
        if (unwanted(dbRecord)) return null
        const { pnomis, requiresWarning } = pnomisOrInconsistentWarning(dbRecord, o.assessStatus)
        if (requiresWarning) {
          logger.warn(
            `geRecategoriseOffenders: Detected status inconsistency for booking id=${o.bookingId}, offenderNo=${o.offenderNo}, Nomis assessment status=${o.assessStatus}, PG status=${dbRecord.status}`
          )
        }

        const decorated = await decorateWithCategorisationData(o, user, nomisClient, dbRecord)
        return {
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          displayStatus: decorated.displayStatus || 'Not started',
          dbStatus: decorated.dbStatus,
          reason: (dbRecord && dbRecord.reviewReason && ReviewReason[dbRecord.reviewReason]) || ReviewReason.DUE,
          nextReviewDateDisplay: dateConverter(o.nextReviewDate),
          overdue: isOverdue(o.nextReviewDate),
          dbRecordExists: decorated.dbRecordExists,
          pnomis,
          buttonText: calculateButtonStatus(dbRecord, o.assessStatus),
        }
      })
    )
  }

  async function handleRiskChangeDecision(token, bookingId, user, decision, transactionalDbClient) {
    try {
      const details = await getOffenderDetails(token, bookingId)

      if (decision === RiskChangeStatus.REVIEW_REQUIRED.name) {
        await updateNextReviewDateIfRequired(token, bookingId, details)
      }

      await formService.updateStatusForOutstandingRiskChange({
        offenderNo: details.offenderNo,
        userId: user,
        status: decision,
        transactionalClient: transactionalDbClient,
      })
    } catch (error) {
      logger.error(error, 'Error during handleRiskChangeDecision')
      throw error
    }
  }

  async function updateNextReviewDateIfRequired(token, bookingId, offenderdetails) {
    try {
      const nextReviewDate = extractNextReviewDate(offenderdetails)
      const nextReviewMoment = moment(nextReviewDate, 'YYYY-MM-DD')
      const today = moment()
      const tenDaysInFutureMoment = today.add(get10BusinessDays(today), 'days')
      if (tenDaysInFutureMoment < nextReviewMoment) {
        logger.info(`updating next review date for offender ${offenderdetails.offenderNo}, bookingId ${bookingId}`)
        const nomisClient = nomisClientBuilder(token)
        // adjust nextReviewDate on nomis which will ensure that the categorisation is picked on the on the recat to do list
        await nomisClient.updateNextReviewDate(bookingId, tenDaysInFutureMoment.format('YYYY-MM-DD'))
      } else {
        logger.info(
          `Next review date for offender ${
            offenderdetails.offenderNo
          }, bookingId ${bookingId} was NOT required, review date is ${nextReviewMoment.format('YYYY-MM-DD')}`
        )
      }
    } catch (error) {
      logger.error(error, `Error during updateNextReviewDate, unable to update next review date for ${bookingId} `)
      throw error
    }
  }

  async function getU21Recats(agencyId, user, nomisClient, transactionalDbClient) {
    const u21From = moment()
      .subtract(22, 'years') // allow up to a year overdue
      .format('YYYY-MM-DD')
    const u21To = moment()
      .subtract(21, 'years')
      .add(config.recatMarginMonths, 'months')
      .format('YYYY-MM-DD')

    const resultsU21 = await nomisClient.getPrisonersAtLocation(agencyId, u21From, u21To)

    const resultsU21IJ = resultsU21.filter(o => /[IJ]/.test(o.categoryCode))

    if (!resultsU21IJ.length) {
      return resultsU21IJ
    }

    // we meed the categorisation records for all the U21 offenders identified
    const eliteCategorisationResultsU21 = await mergeU21ResultWithNomisCategorisationData(
      nomisClient,
      agencyId,
      resultsU21IJ
    )

    return Promise.all(
      eliteCategorisationResultsU21.map(async o => {
        const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
        if (unwanted(dbRecord)) return null
        const decorated = await decorateWithCategorisationData(o, user, nomisClient, dbRecord)

        const { pnomis, requiresWarning } = pnomisOrInconsistentWarning(dbRecord, o.assessStatus)

        if (requiresWarning) {
          logger.warn(
            `geRecategoriseOffenders: Detected status inconsistency for booking id=${o.bookingId}, offenderNo=${o.offenderNo}, Nomis assessment status=${o.assessStatus}, PG status=${dbRecord.status}`
          )
        }
        const nextReviewDate = moment(o.dateOfBirth, 'YYYY-MM-DD')
        const nextReviewDateDisplay = nextReviewDate.add(21, 'years').format('DD/MM/YYYY')
        return {
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          displayStatus: decorated.displayStatus || 'Not started',
          dbStatus: decorated.dbStatus,
          reason: (dbRecord && dbRecord.reviewReason && ReviewReason[dbRecord.reviewReason]) || ReviewReason.AGE,
          nextReviewDateDisplay,
          overdue: isOverdue(nextReviewDate),
          dbRecordExists: decorated.dbRecordExists,
          pnomis,
          buttonText: calculateButtonStatus(dbRecord, o.assessStatus),
        }
      })
    )
  }

  async function getRecategoriseOffenders(token, agencyId, user, transactionalDbClient) {
    try {
      const nomisClient = nomisClientBuilder(token)

      const [decoratedResultsReview, decoratedResultsU21] = await Promise.all([
        getDueRecats(agencyId, user, nomisClient, transactionalDbClient),
        getU21Recats(agencyId, user, nomisClient, transactionalDbClient),
      ])

      if (isNilOrEmpty(decoratedResultsReview) && isNilOrEmpty(decoratedResultsU21)) {
        logger.info(`No recat offenders found for ${agencyId}`)
        return []
      }

      const decoratedReviewAndU21 = [...decoratedResultsReview, ...decoratedResultsU21]
        .filter(o => o) // ignore initial cats (which were set to null)
        .sort((a, b) => {
          const status = sortByStatus(b.dbStatus, a.dbStatus)
          return status === 0 ? sortByDateTime(b.nextReviewDateDisplay, a.nextReviewDateDisplay) : status
        })
      return decoratedReviewAndU21
    } catch (error) {
      logger.error(error, 'Error during getRecategorisedOffenders')
      throw error
    }
  }

  async function mergeU21ResultWithNomisCategorisationData(nomisClient, agencyId, resultsU21IJ) {
    const eliteResultsRaw = await nomisClient.getLatestCategorisationForOffenders(resultsU21IJ.map(c => c.offenderNo))

    // results can include inactive - need to remove
    const eliteResultsFiltered = eliteResultsRaw.filter(c => c.assessmentStatus !== 'I')

    return resultsU21IJ.map(u21 => {
      const categorisation = eliteResultsFiltered.find(o => o.bookingId === u21.bookingId)
      if (categorisation) {
        return {
          assessStatus: categorisation.assessmentStatus,
          ...u21,
        }
      }
      // todo investigate how this can happen
      logger.error(`No latest categorisation found for u21 offender ${u21.offenderNo} booking id: ${u21.bookingId}`)
      return u21
    })
  }

  async function getRiskChangeForOffender(token, bookingId, transactionalClient) {
    try {
      const details = await getOffenderDetails(token, bookingId)
      const riskChange = await formService.getRiskChangeForOffender(details.offenderNo, transactionalClient)
      const changeFlags = riskChangeHelper.assessRiskProfiles(riskChange.oldProfile, riskChange.newProfile)
      return { ...riskChange, ...changeFlags, details }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  function buildSentenceData(sentenceDate) {
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')

    const actualDays = get10BusinessDays(sentenceDateMoment)
    const dateRequiredRaw = sentenceDateMoment.add(actualDays, 'day')
    const dateRequired = dateRequiredRaw.format('DD/MM/YYYY')

    const overdue = dateRequiredRaw.isBefore(moment(0, 'HH'))
    return { daysSinceSentence, dateRequired, sentenceDate, overdue }
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
        dbStatus: categorisation.status,
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
  async function getBasicOffenderDetails(token, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(token)
      return nomisClient.getBasicOffenderDetails(bookingId)
    } catch (error) {
      logger.error(error, 'Error during getBasicOffenderDetails')
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

  const sortByDescendingBookingAndAscendingSequence = (a, b) => {
    if (a.bookingId === b.bookingId) return a.assessmentSeq - b.assessmentSeq
    return b.bookingId - a.bookingId
  }

  async function getCatAInformation(token, offenderNo, currentBookingIdString) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const categories = await getCategoryHistoryWithoutPendingCategories(nomisClient, offenderNo)
      const sortedCategories = categories.sort(sortByDescendingBookingAndAscendingSequence)
      const mostRecentCatA = sortedCategories.find(isCatA)
      const currentBookingId = parseInt(currentBookingIdString, 10)

      let catAType = null
      let catAStartYear = null
      let catAEndYear = null
      let releaseYear = null
      let finalCat = null
      if (mostRecentCatA) {
        const categoriesForBooking = sortedCategories.filter(c => c.bookingId === mostRecentCatA.bookingId)

        catAType = mostRecentCatA.classificationCode
        catAStartYear = getYear(mostRecentCatA.assessmentDate)
        const catAIndex = categoriesForBooking.findIndex(isCatA)
        if (catAIndex < categoriesForBooking.length - 1) {
          catAEndYear = getYear(categoriesForBooking[catAIndex + 1].assessmentDate)
        }
        finalCat = categoriesForBooking[categoriesForBooking.length - 1].classification
        // Populate release date if was not for current booking
        if (currentBookingId !== mostRecentCatA.bookingId) {
          const sentences = await nomisClient.getSentenceHistory(offenderNo)
          const catASentence = sentences.find(s => s.sentenceDetail.bookingId === mostRecentCatA.bookingId)
          if (catASentence) {
            if (catAIndex === categoriesForBooking.length - 1) {
              // Cat A was the last, or only categorisation for this sentence (should not happen!)
              catAEndYear = getYear(catASentence.sentenceDetail.releaseDate)
              logger.warn(`Found sentence which ends as Cat A, bookingId=${mostRecentCatA.bookingId}`)
            }
            releaseYear = getYear(catASentence.sentenceDetail.releaseDate)
          }
        }
      }

      return { catAType, catAStartYear, catAEndYear, releaseYear, finalCat }
    } catch (error) {
      logger.error(error, 'Error during getCatAInformation')
      throw error
    }
  }

  async function getPrisonerBackground(token, offenderNo, approvalDate = null) {
    try {
      const nomisClient = nomisClientBuilder(token)
      const currentCats = await getCategoryHistoryWithoutPendingCategories(nomisClient, offenderNo)
      // If approved, omit any cats that were done later than the approval of this cat
      const filteredCats = approvalDate
        ? currentCats.filter(o => !o.assessmentDate || moment(o.assessmentDate, 'YYYY-MM-DD') <= approvalDate)
        : currentCats

      const decoratedCats = await Promise.all(
        filteredCats.map(async o => {
          const description = await getOptionalAssessmentAgencyDescription(token, o.assessmentAgencyId)
          return {
            ...o,
            agencyDescription: description,
            assessmentDateDisplay: dateConverter(o.assessmentDate),
          }
        })
      )

      return decoratedCats.sort((a, b) => sortByDateTime(a.assessmentDateDisplay, b.assessmentDateDisplay))
    } catch (error) {
      logger.error(error, 'Error during getPrisonerBackground')
      throw error
    }
  }

  async function getCategoryHistoryWithoutPendingCategories(nomisClient, offenderNo) {
    try {
      const allCategorisation = await nomisClient.getCategoryHistory(offenderNo)
      return allCategorisation.filter(c => c.assessmentStatus !== 'P')
    } catch (error) {
      logger.error(error, 'Error during getCategoryHistoryWithoutPendingCategories')
      throw error
    }
  }

  async function getOptionalAssessmentAgencyDescription(token, agencyId) {
    if (agencyId) {
      const nomisClient = nomisClientBuilder(token)
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
      return await nomisClient.createInitialCategorisation({
        bookingId,
        category,
        committee: 'OCA',
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
        reviewCommitteeCode: 'OCA',
      })
    } catch (error) {
      logger.error(error, 'Error during createSupervisorApproval')
      throw error
    }
  }

  async function getOffenceHistory(token, offenderNo) {
    const nomisClient = nomisClientBuilder(token)
    return nomisClient.getOffenceHistory(offenderNo)
  }

  async function isRecat(token, bookingId) {
    // Decide whether INITIAL or RECAT.
    // To detect Cat A etc reliably we have to get cat from nomis.
    // If missing or UXZ it is INITIAL;
    // if B,C,D,I,J it is RECAT;
    // otherwise we cant process it (cat A, or female etc).
    const nomisClient = nomisClientBuilder(token)
    try {
      const cat = await nomisClient.getCategory(bookingId)
      if (!cat.classificationCode || /[UXZ]/.test(cat.classificationCode)) {
        return CatType.INITIAL.name
      }
      if (/[BCDIJ]/.test(cat.classificationCode)) {
        return CatType.RECAT.name
      }
      return null
    } catch (error) {
      return CatType.INITIAL.name
    }
  }

  function calculateButtonStatus(dbRecord, pnomisStatus) {
    let buttonStatus = 'Start'
    if (pnomisStatus === 'A') {
      if (dbRecord && dbRecord.status) {
        if (!(dbRecord.status in [Status.APPROVED.name, Status.AWAITING_APPROVAL.name])) {
          buttonStatus = 'Edit'
        }
      }
      // nomis status is pending approval
    } else if (dbRecord && Status.AWAITING_APPROVAL.name === dbRecord.status) {
      buttonStatus = 'View'
    } else if (
      dbRecord &&
      (Status.STARTED.name === dbRecord.status ||
        Status.SECURITY_BACK.name === dbRecord.status ||
        Status.SUPERVISOR_BACK.name === dbRecord.status ||
        Status.SECURITY_MANUAL.name === dbRecord.status)
    ) {
      buttonStatus = 'Edit'
    }
    return buttonStatus
  }

  function pnomisOrInconsistentWarning(dbRecord, pnomisStatus) {
    const inconsistent = inconsistentCategorisation(dbRecord, pnomisStatus)

    return {
      requiresWarning: inconsistent,
      pnomis: inconsistent || (pnomisStatus === 'P' && (!dbRecord || !dbRecord.status)),
    }
  }

  function inconsistentCategorisation(dbRecord, pnomisStatus) {
    if (pnomisStatus === 'A') {
      return dbRecord && Status.AWAITING_APPROVAL.name === dbRecord.status
    }
    // record is pending, valid status is AWAITING_APPROVAL OR SUPERVISOR_BACK OR SECURITY_BACK OR SECURITY_MANUAL
    return localStatusIsInconstentWithNomisAwaitingApproval(dbRecord)
  }

  async function getOffenderDetailWithFullInfo(offenderNo) {
    const nomisClient = nomisClientBuilder()
    return nomisClient.getOffenderDetailsByOffenderNo(offenderNo)
  }

  return {
    getUncategorisedOffenders,
    getUnapprovedOffenders,
    getReferredOffenders,
    getRecategoriseOffenders,
    getOffenderDetails,
    getBasicOffenderDetails,
    getImage,
    getCatAInformation,
    getOffenceHistory,
    isRecat,
    getOptionalAssessmentAgencyDescription,
    createInitialCategorisation,
    createSupervisorApproval,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getPrisonerBackground,
    getRiskChanges,
    // just for tests:
    buildSentenceData,
    getMatchedCategorisations: matchEliteAndDBCategorisations,
    pnomisOrInconsistentWarning,
    calculateButtonStatus,
    mergeU21ResultWithNomisCategorisationData,
    getOffenderDetailWithFullInfo,
    getRiskChangeForOffender,
    handleRiskChangeDecision,
    updateNextReviewDateIfRequired,
  }
}
