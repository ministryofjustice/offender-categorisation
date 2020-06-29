const path = require('path')
const moment = require('moment')
const logger = require('../../log.js')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const ReviewReason = require('../utils/reviewReasonEnum')
const { isNilOrEmpty, inProgress, getIn, extractNextReviewDate } = require('../utils/functionalHelpers')
const { properCaseName, dateConverter, dateConverterToISO, get10BusinessDays } = require('../utils/utils.js')
const { sortByDateTime, sortByStatus } = require('./offenderSort.js')
const config = require('../config')
const riskChangeHelper = require('../utils/riskChange')
const RiskChangeStatus = require('../utils/riskChangeStatusEnum')

const dirname = process.cwd()

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

async function getOffenceMap(offenderList, nomisClient) {
  const bookingIds = offenderList
    .filter(o => !o.dbRecord || !o.dbRecord.catType || o.dbRecord.catType === CatType.INITIAL.name)
    .map(o => o.bookingId)

  const offences = await nomisClient.getMainOffences(bookingIds)
  // There can (rarely) be > 1 main offence per booking id, but not in the IS91 case
  return new Map(offences.map(offence => [offence.bookingId, offence]))
}

function localStatusIsInconsistentWithNomisAwaitingApproval(dbRecord) {
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
    dbRecord.catType === CatType.INITIAL.name && inProgress(dbRecord)
  )
}

function calculateRecatDisplayStatus(displayStatus) {
  return displayStatus === Status.APPROVED.value || !displayStatus ? 'Not started' : displayStatus
}

module.exports = function createOffendersService(nomisClientBuilder, formService) {
  async function getUncategorisedOffenders(context, user, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)
      const uncategorisedResult = await nomisClient.getUncategorisedOffenders(agencyId)

      if (isNilOrEmpty(uncategorisedResult)) {
        logger.info(`No uncategorised offenders found for ${agencyId}`)
        return []
      }
      const [sentenceMap, offenceMap] = await Promise.all([
        getSentenceMap(uncategorisedResult, nomisClient),
        getOffenceMap(uncategorisedResult, nomisClient),
      ])

      const filterIS91s = o => {
        const offence = offenceMap.get(o.bookingId)
        if (!offence) {
          return true
        }
        if (offence.offenceCode === 'IA99000-001N' && offence.statuteCode === 'ZZ') {
          logger.info(`Filtered out IS91 prisoner: bookingId = ${offence.bookingId}`)
          return false
        }
        return true
      }

      const decoratedResults = await Promise.all(
        uncategorisedResult
          .filter(o => sentenceMap.get(o.bookingId)) // filter out offenders without sentence
          .filter(filterIS91s)
          .map(async o => {
            const dbRecord = await formService.getCategorisationRecord(o.bookingId, transactionalDbClient)
            if (dbRecord.catType === 'RECAT') {
              return null
            }

            const nomisStatusAwaitingApproval = o.status === Status.AWAITING_APPROVAL.name
            const nomisStatusUncategorised = o.status === Status.UNCATEGORISED.name

            const inconsistent =
              (nomisStatusAwaitingApproval && localStatusIsInconsistentWithNomisAwaitingApproval(dbRecord)) ||
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

  async function getCategorisedOffenders(context, user, catType, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const categorisedFromDB = await formService.getCategorisedOffenders(agencyId, catType, transactionalDbClient)
      if (!isNilOrEmpty(categorisedFromDB)) {
        const [categorisedFromElite, userDetailFromElite] = await Promise.all([
          nomisClient.getCategorisedOffenders(categorisedFromDB.map(c => c.bookingId)),
          nomisClient.getUserDetailList(categorisedFromDB.map(c => c.approvedBy)),
        ])

        const matchedCategorisations = matchEliteAndDBCategorisations(categorisedFromElite, categorisedFromDB)

        const decoratedResults = await Promise.all(
          matchedCategorisations.map(async o => {
            // For the approver, preferably use the username stored in PG, and fallback
            // to the unreliable Nomis modify_username for early cats before the approved_by column was created
            const approver = o.dbRecord.approvedBy
              ? userDetailFromElite.find(record => record.username === o.dbRecord.approvedBy)
              : { lastName: o.approverLastName, firstName: o.approverFirstName }

            return {
              ...o,
              ...(await decorateWithCategorisationData(o, user, nomisClient, o.dbRecord)),
              displayName: o.lastName && `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
              displayApprovalDate: dateConverter(o.approvalDate),
              displayCategoriserName:
                o.categoriserLastName &&
                `${properCaseName(o.categoriserLastName)}, ${properCaseName(o.categoriserFirstName)}`, //* **
              displayApproverName:
                approver.lastName && `${properCaseName(approver.lastName)}, ${properCaseName(approver.firstName)}`,
              catTypeDisplay: CatType[o.dbRecord.catType].value,
            }
          })
        )

        return decoratedResults.sort((a, b) => sortByDateTime(a.displayApprovalDate, b.displayApprovalDate))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getCategorisedOffenders')
      throw error
    }
  }

  async function getReferredOffenders(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const securityReferredFromDB = await formService.getSecurityReferredOffenders(agencyId, transactionalDbClient)

      if (!isNilOrEmpty(securityReferredFromDB)) {
        const sentenceMap = await getSentenceMap(securityReferredFromDB, nomisClient)

        const [offenderDetailsFromElite, userDetailFromElite] = await Promise.all([
          nomisClient.getOffenderDetailList(securityReferredFromDB.map(c => c.offenderNo)),
          nomisClient.getUserDetailList(securityReferredFromDB.map(c => c.securityReferredBy)),
        ])

        const decoratedResults = securityReferredFromDB.map(o => {
          const offenderDetail = offenderDetailsFromElite.find(record => record.offenderNo === o.offenderNo)
          if (!offenderDetail) {
            logger.error(`Offender ${o.offenderNo} in DB not found in NOMIS`)
            return o
          }

          let securityReferredBy
          if (o.securityReferredBy) {
            const referrer = userDetailFromElite.find(record => record.username === o.securityReferredBy)
            securityReferredBy = referrer
              ? `${properCaseName(referrer.firstName)} ${properCaseName(referrer.lastName)}`
              : o.securityReferredBy
          }
          const sentenceData = sentenceMap.get(o.bookingId)
            ? buildSentenceData(sentenceMap.get(o.bookingId).sentenceDate)
            : {}

          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            securityReferredBy,
            ...sentenceData,
            catTypeDisplay: CatType[o.catType].value,
            buttonText: getIn(['formObject', 'security', 'review', 'securityReview'], o) ? 'Edit' : 'Start',
          }
        })

        return decoratedResults.sort((a, b) => sortByDateTime(b.dateRequired, a.dateRequired))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getReferredOffenders')
      throw error
    }
  }

  async function getRiskChanges(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

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

          // it is possible that the offender now has a new booking without a categorisation (since the alert was recorded)
          if (offenderCategorisation) {
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
          }
          logger.warn(`Found risk change alert without a categorisation for offender no: ${o.offenderNo}`)
          return null
        })

        return decoratedResults
          .filter(o => o) // ignore records without an associated cat
          .sort((a, b) => sortByDateTime(a.displayCreatedDate, b.displayCreatedDate))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getRiskChanges')
      throw error
    }
  }

  async function getSecurityReviewedOffenders(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const securityReviewedFromDB = await formService.getSecurityReviewedOffenders(agencyId, transactionalDbClient)
      if (!isNilOrEmpty(securityReviewedFromDB)) {
        const [offenderDetailsFromElite, userDetailFromElite] = await Promise.all([
          nomisClient.getOffenderDetailList(securityReviewedFromDB.map(c => c.offenderNo)),
          nomisClient.getUserDetailList(securityReviewedFromDB.map(c => c.securityReviewedBy)),
        ])

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

  async function getUnapprovedOffenders(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const [allUncategorised, allUnapprovedLite] = await Promise.all([
        nomisClient.getUncategorisedOffenders(agencyId),
        formService.getUnapprovedLite(agencyId, transactionalDbClient),
      ])

      // We only want AWAITING_APPROVAL coming back from nomis
      const uncategorisedResult = allUncategorised.filter(s => s.status === Status.AWAITING_APPROVAL.name)

      const unapprovedLiteBookingIds = allUnapprovedLite.map(u => u.bookingId)

      const unapprovedWithDbRecord = await Promise.all(
        uncategorisedResult.map(async s => {
          const dbRecord = await formService.getCategorisationRecord(s.bookingId, transactionalDbClient)
          return { ...s, dbRecord }
        })
      )

      // remove any sent back to categoriser records
      const unapprovedOffenders = unapprovedWithDbRecord
        .filter(
          o =>
            o.dbRecord.status !== Status.SUPERVISOR_BACK.name &&
            o.dbRecord.status !== Status.SECURITY_BACK.name &&
            o.dbRecord.status !== Status.SECURITY_MANUAL.name
        )
        // remove any which are on the 'Other categories' tab
        .filter(o => !unapprovedLiteBookingIds.includes(o.bookingId))

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

  async function getUnapprovedLite(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const unapprovedLite = await formService.getUnapprovedLite(agencyId, transactionalDbClient)

      if (isNilOrEmpty(unapprovedLite)) {
        logger.info(`getUnapprovedLite: No unapproved offenders found for ${agencyId}`)
        return []
      }

      const [offenderDetailsFromElite, userDetailFromElite] = await Promise.all([
        nomisClient.getOffenderDetailList(unapprovedLite.map(c => c.offenderNo)),
        nomisClient.getUserDetailList([...new Set(unapprovedLite.map(c => c.assessedBy))]),
      ])

      const decoratedResults = unapprovedLite.map(o => {
        const offenderDetail = offenderDetailsFromElite.find(record => record.offenderNo === o.offenderNo)
        const assessedDate = moment(o.createdDate).format('DD/MM/YYYY')
        const assessor = userDetailFromElite.find(record => record.username === o.assessedBy)
        const categoriserDisplayName = assessor
          ? `${properCaseName(assessor.firstName)} ${properCaseName(assessor.lastName)}`
          : o.assessedBy

        if (!offenderDetail) {
          logger.error(`getUnapprovedLite: Offender ${o.offenderNo} in DB not found in NOMIS`)
          return { ...o, assessedDate, categoriserDisplayName }
        }
        return {
          ...o,
          assessedDate,
          displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
          categoriserDisplayName,
        }
      })

      return decoratedResults.sort((a, b) => sortByDateTime(b.createdDate, a.createdDate))
    } catch (error) {
      logger.error(error, `Error during getUnapprovedLite for agency ${agencyId}`)
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
          displayStatus: calculateRecatDisplayStatus(decorated.displayStatus),
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

  async function handleRiskChangeDecision(context, bookingId, user, decision, transactionalDbClient) {
    try {
      const details = await getOffenderDetails(context, bookingId)

      if (decision === RiskChangeStatus.REVIEW_REQUIRED.name) {
        await updateNextReviewDateIfRequired(context, bookingId, details)
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

  async function updateNextReviewDateIfRequired(context, bookingId, offenderdetails) {
    try {
      const nextReviewDate = extractNextReviewDate(offenderdetails)
      const nextReviewMoment = moment(nextReviewDate, 'YYYY-MM-DD')
      const today = moment()
      const tenDaysInFutureMoment = today.add(get10BusinessDays(today), 'days')
      if (tenDaysInFutureMoment < nextReviewMoment) {
        logger.info(`updating next review date for offender ${offenderdetails.offenderNo}, bookingId ${bookingId}`)
        const nomisClient = nomisClientBuilder(context)
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
      logger.error(
        error,
        `Error during updateNextReviewDateIfRequired, unable to update next review date for ${bookingId} `
      )
      throw error
    }
  }

  async function updateNextReviewDate(context, bookingId, nextReviewDateUI) {
    try {
      const nextReviewDate = dateConverterToISO(nextReviewDateUI)
      logger.info(`updating next review date for bookingId ${bookingId} to ${nextReviewDate}`)
      const nomisClient = nomisClientBuilder(context)
      await nomisClient.updateNextReviewDate(bookingId, nextReviewDate)
    } catch (error) {
      logger.error(error, `Error during updateNextReviewDate, unable to update next review date for ${bookingId} `)
      throw error
    }
  }

  /**
   * deactivate any existing categorisations to ensure that the categorisation is present on the initial to do list
   */
  async function setInactive(context, bookingId, assessmentStatus) {
    try {
      logger.info(`Setting ${assessmentStatus} cats of bookingId ${bookingId} inactive`)
      const nomisClient = nomisClientBuilder(context)
      await nomisClient.setInactive(bookingId, assessmentStatus)
    } catch (error) {
      logger.error(error, `Error during setInactive, for ${bookingId} `)
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
          displayStatus: calculateRecatDisplayStatus(decorated.displayStatus),
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

  // first array is master if duplicate bookingIds
  function mergeOffenderListsRemovingNulls(masterList, listToMerge) {
    // remove nulls from both lists
    const masterListWithoutNulls = masterList.filter(o => o)
    const listToMergeWithoutNulls = listToMerge.filter(o => o)

    // remove items from second list that are already in first list
    const itemsToAdd = listToMergeWithoutNulls.filter(
      o => !masterListWithoutNulls.some(masterItem => o.bookingId === masterItem.bookingId)
    )

    return masterListWithoutNulls.concat(itemsToAdd)
  }

  async function getRecategoriseOffenders(context, user, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)

      const [decoratedResultsReview, decoratedResultsU21] = await Promise.all([
        getDueRecats(agencyId, user, nomisClient, transactionalDbClient),
        getU21Recats(agencyId, user, nomisClient, transactionalDbClient),
      ])

      if (isNilOrEmpty(decoratedResultsReview) && isNilOrEmpty(decoratedResultsU21)) {
        logger.info(`No recat offenders found for ${agencyId}`)
        return []
      }

      const decoratedReviewAndU21 = mergeOffenderListsRemovingNulls(decoratedResultsU21, decoratedResultsReview) // ignore initial cats (which were set to null)
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

  async function getRiskChangeForOffender(context, bookingId, transactionalClient) {
    try {
      const details = await getOffenderDetails(context, bookingId)
      const riskChange = await formService.getRiskChangeForOffender(details.offenderNo, transactionalClient)
      if (riskChange) {
        const changeFlags = riskChangeHelper.assessRiskProfiles(riskChange.oldProfile, riskChange.newProfile)
        return { ...riskChange, ...changeFlags, details }
      }
      throw new Error(`No risk change record found for offender ${details.offenderNo}`)
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

  async function getOffenderDetails(context, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(context)
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

  async function getBasicOffenderDetails(context, bookingId) {
    try {
      const nomisClient = nomisClientBuilder(context)
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

  async function getImage(context, imageId, res) {
    const nomisClient = nomisClientBuilder(context)
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

  async function getCatAInformation(context, offenderNo, currentBookingIdString) {
    try {
      const nomisClient = nomisClientBuilder(context)
      const categories = await getAllApprovedCategorisationsForOffender(nomisClient, offenderNo)
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
        catAStartYear = getYear(mostRecentCatA.approvalDate)
        const catAIndex = categoriesForBooking.findIndex(isCatA)
        if (catAIndex < categoriesForBooking.length - 1) {
          catAEndYear = getYear(categoriesForBooking[catAIndex + 1].approvalDate)
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

  async function getPrisonerBackground(context, offenderNo, approvalDate = null) {
    try {
      const nomisClient = nomisClientBuilder(context)
      const currentCats = await getAllApprovedCategorisationsForOffender(nomisClient, offenderNo)
      // If approved, omit any cats that were done later than the approval of this cat
      const filteredCats = approvalDate
        ? currentCats.filter(o => !o.approvalDate || moment(o.approvalDate, 'YYYY-MM-DD') <= approvalDate)
        : currentCats

      const uniqueAgencies = [...new Set(filteredCats.map(o => o.assessmentAgencyId))]
      const agencyMap = new Map(
        await Promise.all(uniqueAgencies.map(async a => [a, await getOptionalAssessmentAgencyDescription(context, a)]))
      )

      const decoratedCats = await Promise.all(
        filteredCats.map(async o => {
          const description = agencyMap.get(o.assessmentAgencyId)
          return {
            ...o,
            agencyDescription: description,
            approvalDateDisplay: dateConverter(o.approvalDate),
          }
        })
      )

      return decoratedCats.sort((a, b) => sortByDateTime(a.approvalDateDisplay, b.approvalDateDisplay))
    } catch (error) {
      logger.error(error, 'Error during getPrisonerBackground')
      throw error
    }
  }

  async function getAllApprovedCategorisationsForOffender(nomisClient, offenderNo) {
    try {
      const allCategorisation = await nomisClient.getCategoryHistory(offenderNo)
      // remove any that don't have an approval date  - these could be pending, rejected, cancelled
      return allCategorisation.filter(c => c.approvalDate)
    } catch (error) {
      logger.error(error, 'Error during getAllApprovedCategorisationsForOffender')
      throw error
    }
  }

  async function getCategoryHistory(context, bookingId, transactionalDbClient) {
    const details = await getOffenderDetails(context, bookingId)
    const nomisClient = nomisClientBuilder(context)
    const catRecords = await formService.getHistoricalCategorisationRecords(details.offenderNo, transactionalDbClient)
    const nomisRecords = await getAllApprovedCategorisationsForOffender(nomisClient, details.offenderNo)

    const uniqueAgencies = [...new Set(nomisRecords.map(o => o.assessmentAgencyId))]
    const agencyMap = new Map(
      await Promise.all(uniqueAgencies.map(async a => [a, await getOptionalAssessmentAgencyDescription(context, a)]))
    )

    const dataDecorated = await Promise.all(
      nomisRecords.map(async nomisRecord => {
        const foundCatRecord = catRecords.find(
          o => o.bookingId === nomisRecord.bookingId && o.nomisSeq === nomisRecord.assessmentSeq
        )
        return {
          ...nomisRecord,
          prisonDescription: agencyMap.get(nomisRecord.assessmentAgencyId),
          recordExists: !!foundCatRecord,
          approvalDateDisplay: dateConverter(nomisRecord.approvalDate),
          sequence: foundCatRecord && foundCatRecord.sequence,
        }
      })
    )

    return {
      details,
      history: dataDecorated.sort((a, b) => sortByDateTime(a.approvalDateDisplay, b.approvalDateDisplay)),
    }
  }

  async function getOptionalAssessmentAgencyDescription(context, agencyId) {
    if (agencyId) {
      const nomisClient = nomisClientBuilder(context)
      const agency = await nomisClient.getAgencyDetail(agencyId)
      return agency.description
    }
    return ''
  }

  function getAgencies(context) {
    const nomisClient = nomisClientBuilder(context)
    return nomisClient.getAgencies()
  }

  async function createOrUpdateCategorisation({
    context,
    bookingId,
    overriddenCategory,
    suggestedCategory,
    overriddenCategoryText,
    nextReviewDate,
    nomisSeq,
    transactionalDbClient,
  }) {
    try {
      const category = overriddenCategory || suggestedCategory
      const comment = (overriddenCategoryText && overriddenCategoryText.substring(0, 4000)) || ''
      const nomisClient = nomisClientBuilder(context)
      const nextReviewDateConverted = dateConverterToISO(nextReviewDate)
      if (nomisSeq) {
        return await nomisClient.updateCategorisation({
          bookingId,
          assessmentSeq: nomisSeq,
          category,
          committee: 'OCA',
          comment,
          nextReviewDate: nextReviewDateConverted,
        })
      }
      const nomisKeyMap = await nomisClient.createCategorisation({
        bookingId,
        category,
        committee: 'OCA',
        comment,
        nextReviewDate: nextReviewDateConverted,
      })
      return await formService.recordNomisSeqNumber(bookingId, nomisKeyMap.sequenceNumber, transactionalDbClient)
    } catch (error) {
      logger.error(
        error,
        `Error during createOrUpdateCategorisation for booking id ${bookingId} and user ${context.user.username}`
      )
      throw error
    }
  }

  async function createLiteCategorisation({
    context,
    bookingId,
    category,
    authority,
    nextReviewDate,
    placement,
    comment,
    offenderNo,
    prisonId,
    transactionalClient,
  }) {
    try {
      const nomisClient = nomisClientBuilder(context)
      const nextReviewDateConverted = dateConverterToISO(nextReviewDate)

      const nomisKeyMap = await nomisClient.createCategorisation({
        bookingId,
        category,
        committee: authority,
        comment,
        nextReviewDate: nextReviewDateConverted,
        placementAgencyId: placement,
      })
      logger.info(`Recording cat ${category} assessment for booking id ${bookingId} and user ${context.user.username}`)
      return formService.recordLiteCategorisation({
        context,
        bookingId,
        sequence: nomisKeyMap.sequenceNumber,
        category,
        offenderNo,
        prisonId,
        assessmentCommittee: authority,
        assessmentComment: comment,
        nextReviewDate: nextReviewDateConverted,
        placementPrisonId: placement,
        transactionalClient,
      })
    } catch (error) {
      logger.error(
        error,
        `Error during createLiteCategorisation for booking id ${bookingId} and user ${context.user.username}`
      )
      throw error
    }
  }

  async function createSupervisorApproval(context, bookingId, form) {
    const category = form.supervisorOverriddenCategory || form.proposedCategory
    const comment =
      (form.supervisorOverriddenCategoryText && form.supervisorOverriddenCategoryText.substring(0, 240)) || ''
    const nomisClient = nomisClientBuilder(context)
    try {
      await nomisClient.createSupervisorApproval({
        bookingId,
        category,
        evaluationDate: moment().format('YYYY-MM-DD'),
        approvedCategoryComment: comment,
        committeeCommentText: 'cat-tool approval',
        reviewCommitteeCode: 'OCA',
      })
    } catch (error) {
      logger.error(
        error,
        `Error during createSupervisorApproval for booking id ${bookingId} and user ${context.user.username}`
      )
      throw error
    }
  }

  async function approveLiteCategorisation({
    context,
    bookingId,
    sequence,
    approvedDate,
    supervisorCategory,
    approvedCategoryComment,
    approvedCommittee,
    nextReviewDate,
    approvedPlacement,
    approvedPlacementComment,
    approvedComment,
    transactionalClient,
  }) {
    try {
      const nomisClient = nomisClientBuilder(context)
      const approvedDateConverted = dateConverterToISO(approvedDate)
      const nextReviewDateConverted = dateConverterToISO(nextReviewDate)

      logger.info(
        `Recording cat ${supervisorCategory} approval for booking id ${bookingId} and user ${context.user.username}`
      )
      await formService.approveLiteCategorisation({
        context,
        bookingId,
        sequence,

        approvedDate: approvedDateConverted,
        supervisorCategory,
        approvedCommittee,
        nextReviewDate: nextReviewDateConverted,
        approvedPlacement,
        approvedPlacementComment,
        approvedComment,
        transactionalClient,
      })
      return nomisClient.createSupervisorApproval({
        bookingId,
        assessmentSeq: sequence,

        category: supervisorCategory,
        approvedCategoryComment,
        reviewCommitteeCode: approvedCommittee,
        nextReviewDate: nextReviewDateConverted,
        approvedPlacementAgencyId: approvedPlacement,
        approvedPlacementText: approvedPlacementComment,
        evaluationDate: approvedDateConverted,
        committeeCommentText: approvedComment,
      })
    } catch (error) {
      logger.error(
        error,
        `Error during createLiteCategorisation for booking id ${bookingId} and user ${context.user.username}`
      )
      throw error
    }
  }

  async function getOffenceHistory(context, offenderNo) {
    const nomisClient = nomisClientBuilder(context)
    return nomisClient.getOffenceHistory(offenderNo)
  }

  async function backToCategoriser(context, bookingId, transactionalClient) {
    try {
      const currentCategorisation = await formService.backToCategoriser(bookingId, transactionalClient)
      const details = {
        bookingId,
        assessmentSeq: currentCategorisation.nomisSeq,
        evaluationDate: moment().format('YYYY-MM-DD'),
        reviewCommitteeCode: 'OCA',
        committeeCommentText: 'cat-tool rejected',
      }
      const nomisClient = nomisClientBuilder(context)
      await nomisClient.createSupervisorRejection(details)
      logger.info(
        `Supervisor sent back categorisation record for bookingId: ${bookingId}, offender No: ${currentCategorisation.offenderNo}, user name: ${currentCategorisation.userId}`
      )
    } catch (error) {
      logger.error(error, 'Error during createSupervisorApproval')
      throw error
    }
  }

  function requiredCatType(bookingId, classificationCodeFromNomis, categoryHistory) {
    // Decide whether to do an INITIAL or RECAT (or neither).
    // To detect Cat A etc reliably we have to get cats from nomis.
    // If missing or all cats for this booking are UXZ it is INITIAL;
    // if there is a B,C,D,I,J for this booking it is RECAT;
    // otherwise we cant process it (cat A, or female etc).
    if (!classificationCodeFromNomis) {
      return CatType.INITIAL.name
    }
    if (/[UXZ]/.test(classificationCodeFromNomis)) {
      const catExistsForThisBooking = categoryHistory
        .filter(c => c.bookingId === bookingId)
        .some(c => !/[UXZ]/.test(c.classificationCode))
      return catExistsForThisBooking ? CatType.RECAT.name : CatType.INITIAL.name
    }
    if (/[BCDIJ]/.test(classificationCodeFromNomis)) {
      return CatType.RECAT.name
    }
    return null
  }

  function calculateButtonStatus(dbRecord, pnomisStatus) {
    let buttonStatus = 'Start'
    if (pnomisStatus === 'A') {
      if (inProgress(dbRecord) && dbRecord.status !== Status.AWAITING_APPROVAL.name) {
        buttonStatus = 'Edit'
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
    return localStatusIsInconsistentWithNomisAwaitingApproval(dbRecord)
  }

  async function getOffenderDetailWithFullInfo(context, offenderNo) {
    const nomisClient = nomisClientBuilder(context)
    return nomisClient.getOffenderDetailsByOffenderNo(offenderNo)
  }

  async function checkAndMergeOffenderNo(context, bookingId, transactionalDbClient) {
    const nomisClient = nomisClientBuilder(context)
    logger.debug(`Merge: check for merged booking for ID ${bookingId}`)
    const booking = await nomisClient.getBasicOffenderDetails(bookingId)
    const ids = await nomisClient.getIdentifiersByBookingId(bookingId)
    logger.info({ ids }, 'Merge: result from getIdentifiersByBookingId()')
    await Promise.all(
      ids
        .filter(id => id.type === 'MERGED')
        .map(async id => {
          const from = id.value
          const to = booking.offenderNo
          const rows = await formService.updateOffenderIdentifierReturningBookingId(from, to, transactionalDbClient)
          await Promise.all(
            rows.map(async r => {
              logger.info(
                `Merge: row updated for bookingId ${r.booking_id}, changing offender no from ${from} to ${to}`
              )
              const dbRecord = await formService.getCategorisationRecord(r.booking_id, transactionalDbClient)
              if (
                dbRecord.status === Status.AWAITING_APPROVAL.name ||
                dbRecord.status === Status.SUPERVISOR_BACK.name
              ) {
                logger.info(`Merge: calling setInactive for ${r.booking_id}`)
                // The merge process may have copied an older active record to a higher seq no than the pending record
                await setInactive(context, r.booking_id, 'ACTIVE')
              }
            })
          )
        })
    )
  }

  return {
    getUncategorisedOffenders,
    getUnapprovedOffenders,
    getUnapprovedLite,
    getReferredOffenders,
    getRecategoriseOffenders,
    getOffenderDetails,
    getBasicOffenderDetails,
    getImage,
    getCatAInformation,
    getOffenceHistory,
    backToCategoriser,
    requiredCatType,
    getOptionalAssessmentAgencyDescription,
    getAgencies,
    createOrUpdateCategorisation,
    createLiteCategorisation,
    createSupervisorApproval,
    approveLiteCategorisation,
    getCategorisedOffenders,
    getSecurityReviewedOffenders,
    getPrisonerBackground,
    getRiskChanges,
    getOffenderDetailWithFullInfo,
    getRiskChangeForOffender,
    handleRiskChangeDecision,
    updateNextReviewDateIfRequired,
    updateNextReviewDate,
    setInactive,
    getCategoryHistory,
    checkAndMergeOffenderNo,
    // just for tests:
    buildSentenceData,
    getMatchedCategorisations: matchEliteAndDBCategorisations,
    pnomisOrInconsistentWarning,
    calculateButtonStatus,
    mergeU21ResultWithNomisCategorisationData,
    mergeOffenderLists: mergeOffenderListsRemovingNulls,
  }
}
