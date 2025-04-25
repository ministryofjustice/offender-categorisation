const path = require('path')
const moment = require('moment')
const logger = require('../../log')
const Status = require('../utils/statusEnum')
const CatType = require('../utils/catTypeEnum')
const ReviewReason = require('../utils/reviewReasonEnum')
const { isNilOrEmpty, inProgress, getIn, extractNextReviewDate } = require('../utils/functionalHelpers')
const {
  properCaseName,
  dateConverter,
  dateConverterToISO,
  get10BusinessDays,
  getNamesFromString,
} = require('../utils/utils')
const { sortByDateTime, sortByStatus } = require('./offenderSort')
const { config } = require('../config')
const riskChangeHelper = require('../utils/riskChange')
const RiskChangeStatus = require('../utils/riskChangeStatusEnum')
const liteCategoriesPrisonerPartition = require('../utils/liteCategoriesPrisonerPartition')
const { filterListOfPrisoners } = require('./filter/homeFilter')
const {
  mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto,
} = require('./recategorisation/prisonerSearch/recategorisationPrisonerSearch.dto')
const { isReviewOverdue } = require('./reviewStatusCalculator')
const { LEGAL_STATUS_REMAND } = require('../data/prisonerSearch/prisonerSearch.dto')

const dirname = process.cwd()

function isCatA(c) {
  return (
    c.classificationCode === 'A' ||
    c.classificationCode === 'H' ||
    c.classificationCode === 'P' ||
    c.classificationCode === 'Q'
  )
}

function getYear(isoDate) {
  return isoDate && isoDate.substring(0, 4)
}

async function getSentenceMap(offenderList, prisonerSearchClient) {
  const bookingIds = offenderList
    .filter(o => !o.dbRecord || !o.dbRecord.catType || o.dbRecord.catType === CatType.INITIAL.name)
    .map(o => o.bookingId)

  const prisoners = await prisonerSearchClient.getPrisonersByBookingIds(bookingIds)

  return new Map(
    prisoners
      .filter(s => s.sentenceStartDate) // the endpoint returns records for offenders without sentences
      .map(s => [s.bookingId, { sentenceDate: s.sentenceStartDate }]),
  )
}

async function getPrisonerSearchData(offenderList, prisonerSearchClient) {
  const bookingIds = offenderList.map(offender => offender.bookingId)
  const prisoners = await prisonerSearchClient.getPrisonersByBookingIds(bookingIds)

  return new Map(prisoners.map(s => [s.bookingId, mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto(s)]))
}

async function getReleaseDateMap(offenderList, prisonerSearchClient) {
  const bookingIds = offenderList
    .filter(o => !o.dbRecord || !o.dbRecord.catType || o.dbRecord.catType === CatType.RECAT.name)
    .map(o => o.bookingId)

  const prisoners = await prisonerSearchClient.getPrisonersByBookingIds(bookingIds)

  return new Map(
    prisoners
      .filter(s => s.releaseDate) // the endpoint returns records for offenders without sentences
      .map(s => [s.bookingId, s.releaseDate]),
  )
}

async function getPrisoners(offenderList, prisonerSearchClient) {
  const bookingIds = offenderList.filter(o => !o.dbRecord || !o.dbRecord.catType).map(o => o.bookingId)

  return prisonerSearchClient.getPrisonersByBookingIds(bookingIds)
}

async function getPomMap(offenderList, allocationClient) {
  const result = new Map()
  const BATCH_SIZE = 15
  for (let range = 0; range < offenderList.length; range += BATCH_SIZE) {
    const offenderBatch = offenderList.slice(range, range + BATCH_SIZE)
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      offenderBatch.map(async offender => {
        const no = offender.offenderNo || offender.prisonerNumber
        const pomData = await allocationClient.getPomByOffenderNo(no)
        result.set(no, pomData)
      }),
    )
  }
  logger.debug('end getPomMap')
  return result
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

function isInitialInProgress(dbRecord) {
  return dbRecord?.catType === CatType.INITIAL.name && inProgress(dbRecord)
}

function calculateRecatDisplayStatus(displayStatus) {
  return displayStatus === Status.APPROVED.value || !displayStatus ? 'Not started' : displayStatus
}

function isNewSecurityReferred(offenderNo, securityReferredOffenders) {
  return securityReferredOffenders.filter(s => s.offenderNo === offenderNo).some(s => s.status === 'NEW')
}

module.exports = function createOffendersService(
  nomisClientBuilder,
  allocationClientBuilder,
  formService,
  prisonerSearchClientBuilder,
  risksAndNeedsClientBuilder,
  probationOffenderSearchClientBuilder,
) {
  async function getUncategorisedOffenders(context, user, filters = {}) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)
      const allocationClient = allocationClientBuilder(context)
      const prisonerSearchClient = prisonerSearchClientBuilder(context)
      const risksAndNeedsClient = risksAndNeedsClientBuilder(context.user)
      const probationOffenderSearchClient = probationOffenderSearchClientBuilder(context.user)
      const uncategorisedResult = await nomisClient.getUncategorisedOffenders(agencyId)

      const dbManualInProgress = await formService.getCategorisationRecords(
        agencyId,
        [
          Status.STARTED.name,
          Status.SECURITY_BACK.name,
          Status.SUPERVISOR_BACK.name,
          Status.SECURITY_AUTO.name,
          Status.SECURITY_FLAGGED.name,
          Status.SECURITY_MANUAL.name,
        ],
        CatType.INITIAL.name,
        ReviewReason.MANUAL.name,
      )

      if (isNilOrEmpty(uncategorisedResult)) {
        logger.info(`No uncategorised offenders found for ${agencyId}`)
        return []
      }

      const combined = [...uncategorisedResult, ...dbManualInProgress]

      const bookingIds = combined
        .filter(o => !o.dbRecord || !o.dbRecord.catType || o.dbRecord.catType === CatType.INITIAL.name)
        .map(o => o.bookingId)

      const [prisoners, securityReferredOffenders] = await Promise.all([
        prisonerSearchClient.getPrisonersByBookingIds(bookingIds),
        formService.getSecurityReferrals(agencyId),
      ])

      const prisonerMap = new Map(prisoners.map(prisoner => [prisoner.bookingId, prisoner]))

      const sentenceMap = new Map(
        prisoners
          .filter(s => s.sentenceStartDate) // the endpoint returns records for offenders without sentences
          .map(s => [s.bookingId, { sentenceDate: s.sentenceStartDate }]),
      )

      const filterIS91s = o => {
        const offence = prisonerMap.get(o.bookingId)
        if (!offence) {
          return true
        }
        if (offence.mostSeriousOffence === 'ILLEGAL IMMIGRANT/DETAINEE') {
          logger.info(`Filtered out IS91 prisoner: bookingId = ${offence.bookingId}`)
          return false
        }
        return true
      }

      const nomisFiltered = uncategorisedResult
        .filter(o => sentenceMap.get(o.bookingId)) // filter out offenders without sentence
        .filter(filterIS91s)

      // trim db results to only those not in the Nomis-derived list
      const dbInProgressFiltered = dbManualInProgress.filter(d => !nomisFiltered.some(n => d.bookingId === n.bookingId))

      const allRecords = [...nomisFiltered, ...dbInProgressFiltered]
      const pomMap = await getPomMap(allRecords, allocationClient)
      const filteredRecords = await filterListOfPrisoners(
        filters,
        allRecords,
        new Map(prisoners.map(s => [s.bookingId, mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto(s)])),
        nomisClient,
        agencyId,
        pomMap,
        user.staffId,
        risksAndNeedsClient,
        probationOffenderSearchClient,
      )

      const decoratedResults = await Promise.all(
        filteredRecords.map(async raw => {
          const nomisRecord = raw.lastName ? raw : await nomisClient.getBasicOffenderDetails(raw.bookingId)
          const dbRecord = raw.lastName ? await formService.getCategorisationRecord(raw.bookingId) : raw

          if (dbRecord.catType === 'RECAT') {
            logger.info(
              `Initial cat missing recalls investigation: booking id=${dbRecord.bookingId}, offenderNo=${dbRecord.offenderNo}, Nomis status=${nomisRecord.status}, PG status=${dbRecord.status}`,
            )
            return null
          }

          const assessmentData = await formService.getLiteCategorisation(nomisRecord.bookingId)
          const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
          const nomisStatusAwaitingApproval = nomisRecord.status === Status.AWAITING_APPROVAL.name
          const nomisStatusUncategorised = nomisRecord.status === Status.UNCATEGORISED.name
          const pomData = pomMap.get(nomisRecord.offenderNo)
          const inconsistent =
            (nomisStatusAwaitingApproval && localStatusIsInconsistentWithNomisAwaitingApproval(dbRecord)) ||
            (nomisStatusUncategorised &&
              (dbRecord.status === Status.AWAITING_APPROVAL.name || dbRecord.status === Status.APPROVED.name))

          const pnomis = liteInProgress
            ? 'OTHER'
            : (inconsistent || (nomisStatusAwaitingApproval && !dbRecord.status)) && 'PNOMIS'

          const sentence = sentenceMap.get(nomisRecord.bookingId)
          const row = {
            ...nomisRecord,
            displayName: `${properCaseName(nomisRecord.lastName)}, ${properCaseName(nomisRecord.firstName)}`,
            ...buildSentenceData(sentence && sentence.sentenceDate),
            ...(await decorateWithCategorisationData(nomisRecord, user, nomisClient, dbRecord)),
            pnomis,
            pom: pomData?.primary_pom?.name && getNamesFromString(pomData.primary_pom.name),
          }
          if (inconsistent && !liteInProgress) {
            logger.warn(
              `getUncategorisedOffenders: Detected status inconsistency for booking id=${row.bookingId}, offenderNo=${row.offenderNo}, Nomis status=${nomisRecord.status}, PG status=${dbRecord.status}`,
            )
          }
          return row
        }),
      )

      return decoratedResults
        .filter(o => o) // ignore recats (which were set to null)
        .sort((a, b) => {
          const status = sortByStatus(b.dbStatus, a.dbStatus)
          return status === 0 ? sortByDateTime(b.dateRequired, a.dateRequired) : status
        })
        .map(o => {
          return {
            ...o,
            securityReferred: isNewSecurityReferred(o.offenderNo, securityReferredOffenders),
          }
        })
    } catch (error) {
      logger.error(error, 'Error during getUncategorisedOffenders')
      throw error
    }
  }

  const matchEliteAndDBCategorisations = (categorisedFromElite, categorisedFromDB) =>
    categorisedFromDB.map(dbRecord => {
      const elite = categorisedFromElite.find(
        record => record.bookingId === dbRecord.bookingId && record.assessmentSeq === dbRecord.nomisSeq,
      )
      if (elite) {
        return {
          dbRecord,
          ...elite,
        }
      }
      logger.warn(
        `matchEliteAndDBCategorisations: Found database record with no elite record, bookingId=${dbRecord.bookingId}, offenderNo=${dbRecord.offenderNo}, nomisSeq=${dbRecord.nomisSeq}`,
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
              sequence: o.dbRecord.sequence,
            }
          }),
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
      const prisonerSearchClient = prisonerSearchClientBuilder(context)

      const securityReferredFromDB = await formService.getSecurityReferredOffenders(agencyId, transactionalDbClient)

      if (!isNilOrEmpty(securityReferredFromDB)) {
        const sentenceMap = await getSentenceMap(securityReferredFromDB, prisonerSearchClient)

        const [offenderDetailsFromNomis, userDetailFromElite, nomisCatData] = await Promise.all([
          nomisClient.getOffenderDetailList(securityReferredFromDB.map(c => c.offenderNo)),
          nomisClient.getUserDetailList(securityReferredFromDB.map(c => c.securityReferredBy)),
          nomisClient.getLatestCategorisationForOffenders(
            securityReferredFromDB.filter(c => c.catType === CatType.RECAT.name).map(c => c.offenderNo),
          ),
        ])

        const decoratedResults = securityReferredFromDB.map(o => {
          const offenderDetail = offenderDetailsFromNomis.find(record => record.offenderNo === o.offenderNo)
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

          let sentenceAndDate
          if (o.catType === CatType.INITIAL.name) {
            const entry = sentenceMap.get(o.bookingId)
            sentenceAndDate = entry && buildSentenceData(entry.sentenceDate)
          } else {
            const nomisCat = nomisCatData.find(record => record.bookingId === o.bookingId)
            sentenceAndDate = { dateRequired: nomisCat && dateConverter(nomisCat.nextReviewDate) }
          }

          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            securityReferredBy,
            ...sentenceAndDate,
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

  async function getUpcomingReferredOffenders(context, transactionalDbClient) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)
      const prisonerSearchClient = prisonerSearchClientBuilder(context)

      const securityReferred = await formService.getSecurityReferrals(agencyId, transactionalDbClient)
      const newSecurityReferred = securityReferred.filter(s => s.status === 'NEW')

      if (!isNilOrEmpty(newSecurityReferred)) {
        const [offenderDetailsFromNomis, userDetailFromElite] = await Promise.all([
          nomisClient.getOffenderDetailList(newSecurityReferred.map(c => c.offenderNo)),
          nomisClient.getUserDetailList(newSecurityReferred.map(c => c.userId)),
        ])
        const prisoners = await prisonerSearchClient.getPrisonersByBookingIds(
          offenderDetailsFromNomis.map(o => o.bookingId),
        )

        const sentenceMap = new Map(
          prisoners
            .filter(s => s.sentenceStartDate) // the endpoint returns records for offenders without sentences
            .map(s => [s.bookingId, { sentenceDate: s.sentenceStartDate }]),
        )

        const decoratedResults = newSecurityReferred.map(o => {
          const offenderDetail = offenderDetailsFromNomis.find(record => record.offenderNo === o.offenderNo)
          if (!offenderDetail) {
            logger.error(`Offender ${o.offenderNo} in DB not found in NOMIS`)
            return o
          }

          let securityReferredBy
          if (o.userId) {
            const referrer = userDetailFromElite.find(record => record.username === o.userId)
            securityReferredBy = referrer
              ? `${properCaseName(referrer.lastName)}, ${properCaseName(referrer.firstName)}`
              : o.userId
          }

          const entry = sentenceMap.get(offenderDetail.bookingId)
          const sentenceAndDate = entry && buildSentenceData(entry.sentenceDate)

          return {
            ...o,
            offenderNo: offenderDetail.offenderNo,
            displayName: `${properCaseName(offenderDetail.lastName)}, ${properCaseName(offenderDetail.firstName)}`,
            securityReferredBy,
            ...sentenceAndDate,
            bookingId: offenderDetail.bookingId,
          }
        })

        return decoratedResults.sort((a, b) => sortByDateTime(b.dateRequired, a.dateRequired))
      }
      return []
    } catch (error) {
      logger.error(error, 'Error during getUpcomingReferredOffenders')
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
            record => record.offenderNo === o.offenderNo,
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
      const prisonerSearchClient = prisonerSearchClientBuilder(context)

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
        }),
      )

      // remove any sent back to categoriser records
      const unapprovedOffenders = unapprovedWithDbRecord
        .filter(
          o =>
            o.dbRecord.status !== Status.SUPERVISOR_BACK.name &&
            o.dbRecord.status !== Status.SECURITY_BACK.name &&
            o.dbRecord.status !== Status.SECURITY_MANUAL.name,
        )
        // remove any which are on the 'Other categories' tab
        .filter(o => !unapprovedLiteBookingIds.includes(o.bookingId))

      if (isNilOrEmpty(unapprovedOffenders)) {
        logger.info(`getUnapprovedOffenders: No unapproved offenders found for ${agencyId}`)
        return []
      }

      const sentenceMap = await getSentenceMap(unapprovedOffenders, prisonerSearchClient)

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
            `getUnapprovedOffenders: Detected status inconsistency for booking id=${row.bookingId}, offenderNo=${row.offenderNo}, PG status=${row.dbRecord.status}`,
          )
        }
        if (dbRecordExists && row.dbRecord.nomisSeq !== row.assessmentSeq) {
          logger.warn(
            `getUnapprovedOffenders: sequence mismatch for bookingId=${row.bookingId}, offenderNo=${row.offenderNo}, Nomis status=${o.status}, nomisSeq=${row.dbRecord.nomisSeq}, assessmentSeq=${row.assessmentSeq}`,
          )
        }
        return row
      })

      return decoratedResults.sort((a, b) =>
        sortByDateTime(
          b.dateRequired ? b.dateRequired : b.nextReviewDate,
          a.dateRequired ? a.dateRequired : a.nextReviewDate,
        ),
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
      const prisonerSearchClient = prisonerSearchClientBuilder(context)

      const unapprovedLite = await formService.getUnapprovedLite(agencyId, transactionalDbClient)

      if (isNilOrEmpty(unapprovedLite)) {
        logger.info(`getUnapprovedLite: No unapproved offenders found for ${agencyId}`)
        return []
      }

      const [offenderDetailsFromElite, userDetailFromElite] = await Promise.all([
        nomisClient.getOffenderDetailList(unapprovedLite.map(c => c.offenderNo)),
        nomisClient.getUserDetailList([...new Set(unapprovedLite.map(c => c.assessedBy))]),
      ])

      // cannot merge with promise.all as only one concurrent call can be sent to prisoner search api
      const prisonerData = await getPrisoners(unapprovedLite, prisonerSearchClient)

      const [insidePrisonPartition, releasedPartition] = liteCategoriesPrisonerPartition(unapprovedLite, prisonerData)
      const insidePrison = insidePrisonPartition.map(o => o.bookingId)
      const released = releasedPartition.map(o => o.bookingId)

      if (released.length) {
        logger.debug('The following prisoners should be removed from the lite_category table', released)
      }

      const decoratedResults = unapprovedLite
        .filter(offender => insidePrison.includes(offender.bookingId))
        .map(o => {
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

  function isNextReviewAfterRelease(nomisRecord, releaseDate) {
    const { nextReviewDate } = nomisRecord
    return nextReviewDate && releaseDate && moment(nextReviewDate).isAfter(moment(releaseDate))
  }

  function isAwaitingApprovalOrSecurity(status) {
    return [
      Status.AWAITING_APPROVAL.name,
      Status.SECURITY_BACK.name,
      Status.SECURITY_MANUAL.name,
      Status.SECURITY_AUTO.name,
    ].includes(status)
  }

  function isRejectedBySupervisorSuitableForDisplay(dbRecord, releaseDate) {
    const isSupervisorBack = dbRecord.status === Status.SUPERVISOR_BACK.name
    const hasBeenReleased = moment().isAfter(moment(releaseDate))
    return !hasBeenReleased && isSupervisorBack
  }

  async function getDueRecats(
    agencyId,
    user,
    nomisClient,
    allocationClient,
    prisonerSearchClient,
    risksAndNeedsClient,
    probationOffenderSearchClient,
    filters = {},
    withSi1481Changes = false,
  ) {
    const reviewTo = moment().add(config.recatMarginMonths, 'months').format('YYYY-MM-DD')

    const resultsReview = await nomisClient.getRecategoriseOffenders(agencyId, reviewTo)
    const dbManualInProgress = await formService.getCategorisationRecords(
      agencyId,
      [
        Status.STARTED.name,
        Status.SECURITY_BACK.name,
        Status.SUPERVISOR_BACK.name,
        Status.SECURITY_AUTO.name,
        Status.SECURITY_FLAGGED.name,
        Status.SECURITY_MANUAL.name,
      ],
      CatType.RECAT.name,
      ReviewReason.MANUAL.name,
    )

    // trim db results to only those not in the Nomis-derived list

    const dbInProgressFiltered = dbManualInProgress.filter(d => !resultsReview.some(n => d.bookingId === n.bookingId))

    const allOffenders = [...resultsReview, ...dbInProgressFiltered]
    const [prisonerSearchData, pomMap] = await Promise.all([
      getPrisonerSearchData(allOffenders, prisonerSearchClient),
      getPomMap(allOffenders, allocationClient),
    ])

    const filteredPrisoners = await filterListOfPrisoners(
      filters,
      allOffenders,
      prisonerSearchData,
      nomisClient,
      agencyId,
      pomMap,
      user.staffId,
      risksAndNeedsClient,
      probationOffenderSearchClient,
    )

    return Promise.all(
      filteredPrisoners.map(async raw => {
        const nomisRecord = raw.lastName ? raw : await getOffenderDetailsWithNextReviewDate(nomisClient, raw.bookingId)
        const dbRecord = await formService.getCategorisationRecord(raw.bookingId)
        const pomData = pomMap.get(nomisRecord.offenderNo)

        if (isInitialInProgress(dbRecord)) {
          return null
        }

        const prisonerSearchRecord = prisonerSearchData.get(raw.bookingId) || null
        if (withSi1481Changes && prisonerSearchRecord?.legalStatus === LEGAL_STATUS_REMAND) {
          return null
        }

        if (
          prisonerSearchRecord == null ||
          prisonerSearchRecord.sentenceStartDate == null ||
          moment(prisonerSearchRecord.sentenceStartDate).isAfter(moment(nomisRecord.assessmentDate))
        ) {
          logger.info(
            `recategorisationDashboardErrorInvestigation: ${nomisRecord.offenderNo}, assessmentDate = ${nomisRecord.assessmentDate}, sentence date = ${prisonerSearchRecord?.sentenceStartDate}, next review date = ${nomisRecord.nextReviewDate}, legalStatus = ${prisonerSearchRecord?.legalStatus}, recall = ${prisonerSearchRecord?.recall}`,
          )
        }

        const releaseDateForDecidingIfRecordShouldBeIncluded =
          !raw.dbRecord || !raw.dbRecord.catType || raw.dbRecord.catType === CatType.RECAT.name
            ? prisonerSearchData.get(raw.bookingId)?.releaseDate || null
            : null

        if (
          isNextReviewAfterRelease(nomisRecord, releaseDateForDecidingIfRecordShouldBeIncluded) &&
          !isAwaitingApprovalOrSecurity(dbRecord.status) &&
          !isRejectedBySupervisorSuitableForDisplay(dbRecord, releaseDateForDecidingIfRecordShouldBeIncluded)
        ) {
          return null
        }

        const liteDbRecord = await formService.getLiteCategorisation(nomisRecord.bookingId)
        const liteInProgress = liteDbRecord.bookingId && !liteDbRecord.approvedDate
        const { pnomis, requiresWarning } = pnomisOrInconsistentWarning(
          dbRecord,
          nomisRecord.assessStatus,
          liteInProgress,
        )
        if (requiresWarning) {
          logger.warn(
            `getDueRecats: Detected status inconsistency for booking id=${nomisRecord.bookingId}, offenderNo=${nomisRecord.offenderNo}, Nomis assessment status=${nomisRecord.assessStatus}, PG status=${dbRecord.status}`,
          )
        }

        const decorated = await decorateWithCategorisationData(nomisRecord, user, nomisClient, dbRecord)
        const buttonText = calculateButtonStatus(dbRecord, nomisRecord.assessStatus)
        // if this review hasn't been started the reason is always 'Review Due', for started reviews, use the persisted reason
        const reason =
          (buttonText !== 'Start' && dbRecord && dbRecord.reviewReason && ReviewReason[dbRecord.reviewReason]) ||
          ReviewReason.DUE

        return {
          ...nomisRecord,
          displayName: `${properCaseName(nomisRecord.lastName)}, ${properCaseName(nomisRecord.firstName)}`,
          displayStatus: calculateRecatDisplayStatus(decorated.displayStatus),
          dbStatus: decorated.dbStatus,
          reason,
          nextReviewDateDisplay: dateConverter(nomisRecord.nextReviewDate),
          overdue: isReviewOverdue(nomisRecord.nextReviewDate),
          overdueText: getOverdueText(nomisRecord.nextReviewDate),
          dbRecordExists: decorated.dbRecordExists,
          pnomis,
          buttonText,
          pom: pomData?.primary_pom?.name && getNamesFromString(pomData.primary_pom.name),
        }
      }),
    )
  }

  const getOffenderDetailsWithNextReviewDate = async (nomisClient, bookingId) => {
    const offenderDetails = await nomisClient.getOffenderDetails(bookingId)
    return (offenderDetails && { ...offenderDetails, nextReviewDate: extractNextReviewDate(offenderDetails) }) || {}
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
          }, bookingId ${bookingId} was NOT required, review date is ${nextReviewMoment.format('YYYY-MM-DD')}`,
        )
      }
    } catch (error) {
      logger.error(
        error,
        `Error during updateNextReviewDateIfRequired, unable to update next review date for ${bookingId} `,
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

  async function getU21Recats(
    agencyId,
    user,
    nomisClient,
    allocationClient,
    prisonerSearchClient,
    risksAndNeedsClient,
    probationOffenderSearchClient,
    filters = {},
  ) {
    const u21From = moment()
      .subtract(22, 'years') // allow up to a year overdue
      .format('YYYY-MM-DD')
    const u21To = moment().subtract(21, 'years').add(config.recatMarginMonths, 'months').format('YYYY-MM-DD')

    const resultsU21 = await prisonerSearchClient.getPrisonersAtLocation(agencyId, u21From, u21To)

    const resultsU21IJ = resultsU21.filter(o => /[IJ]/.test(o.category))

    if (!resultsU21IJ.length) {
      return resultsU21IJ
    }

    const [eliteCategorisationResultsU21, pomMap] = await Promise.all([
      // we need the categorisation records for all the U21 offenders identified
      mergeU21ResultWithNomisCategorisationData(nomisClient, agencyId, resultsU21IJ),
      getPomMap(resultsU21IJ, allocationClient),
    ])

    const u21map = new Map(
      resultsU21.map(s => [s.bookingId, mapPrisonerSearchDtoToRecategorisationPrisonerSearchDto(s)]),
    )

    const filteredEliteCategorisationResultsU21 = await filterListOfPrisoners(
      filters,
      eliteCategorisationResultsU21,
      u21map,
      nomisClient,
      agencyId,
      pomMap,
      user.staffId,
      risksAndNeedsClient,
      probationOffenderSearchClient,
    )

    return Promise.all(
      filteredEliteCategorisationResultsU21.map(async o => {
        const dbRecord = await formService.getCategorisationRecord(o.bookingId)
        const assessmentData = await formService.getLiteCategorisation(o.bookingId)
        const pomData = pomMap.get(o.offenderNo)

        if (isInitialInProgress(dbRecord)) {
          return null
        }
        const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
        const decorated = await decorateWithCategorisationData(o, user, nomisClient, dbRecord)

        const { pnomis, requiresWarning } = pnomisOrInconsistentWarning(dbRecord, o.assessStatus, liteInProgress)

        if (requiresWarning) {
          logger.warn(
            `getU21Recats: Detected status inconsistency for booking id=${o.bookingId}, offenderNo=${o.offenderNo}, Nomis assessment status=${o.assessStatus}, PG status=${dbRecord.status}`,
          )
        }
        const nextReviewDate = moment(o.dateOfBirth, 'YYYY-MM-DD')
        const nextReviewDateDisplay = nextReviewDate.add(21, 'years').format('DD/MM/YYYY')
        const buttonText = calculateButtonStatus(dbRecord, o.assessStatus)
        // if this review hasn't been started the reason is always 'age 21'. For started reviews, use the persisted reason
        const reason =
          (buttonText !== 'Start' && dbRecord && dbRecord.reviewReason && ReviewReason[dbRecord.reviewReason]) ||
          ReviewReason.AGE

        return {
          ...o,
          displayName: `${properCaseName(o.lastName)}, ${properCaseName(o.firstName)}`,
          displayStatus: calculateRecatDisplayStatus(decorated.displayStatus),
          dbStatus: decorated.dbStatus,
          reason,
          nextReviewDateDisplay,
          overdue: isReviewOverdue(nextReviewDate),
          overdueText: getOverdueText(nextReviewDate),
          dbRecordExists: decorated.dbRecordExists,
          pnomis,
          buttonText,
          pom: pomData?.primary_pom?.name && getNamesFromString(pomData.primary_pom.name),
        }
      }),
    )
  }

  // first array is master if duplicate bookingIds
  function mergeOffenderListsRemovingNulls(masterList, listToMerge) {
    // remove nulls from both lists
    const masterListWithoutNulls = masterList.filter(o => o)
    const listToMergeWithoutNulls = listToMerge.filter(o => o)

    // remove items from second list that are already in first list
    const itemsToAdd = listToMergeWithoutNulls.filter(
      o => !masterListWithoutNulls.some(masterItem => o.bookingId === masterItem.bookingId),
    )

    return masterListWithoutNulls.concat(itemsToAdd)
  }

  async function getRecategoriseOffenders(context, user, filters = {}, withSi1481Changes = false) {
    const agencyId = context.user.activeCaseLoad.caseLoadId
    try {
      const nomisClient = nomisClientBuilder(context)
      const allocationClient = allocationClientBuilder(context)
      const prisonerSearchClient = prisonerSearchClientBuilder(context)
      const risksAndNeedsClient = risksAndNeedsClientBuilder(context.user)
      const probationOffenderSearchClient = probationOffenderSearchClientBuilder(context.user)

      const [decoratedResultsReview, decoratedResultsU21, securityReferredOffenders] = await Promise.all([
        getDueRecats(
          agencyId,
          user,
          nomisClient,
          allocationClient,
          prisonerSearchClient,
          risksAndNeedsClient,
          probationOffenderSearchClient,
          filters,
          withSi1481Changes,
        ),
        getU21Recats(
          agencyId,
          user,
          nomisClient,
          allocationClient,
          prisonerSearchClient,
          risksAndNeedsClient,
          probationOffenderSearchClient,
          filters,
        ),
        formService.getSecurityReferrals(agencyId),
      ])

      if (isNilOrEmpty(decoratedResultsReview) && isNilOrEmpty(decoratedResultsU21)) {
        logger.info(`No recat offenders found for ${agencyId}`)
        return []
      }

      return mergeOffenderListsRemovingNulls(decoratedResultsU21, decoratedResultsReview) // ignore initial cats (which were set to null)
        .sort((a, b) => {
          const status = sortByStatus(b.dbStatus, a.dbStatus)
          return status === 0 ? sortByDateTime(b.nextReviewDateDisplay, a.nextReviewDateDisplay) : status
        })
        .map(o => {
          return {
            ...o,
            securityReferred: isNewSecurityReferred(o.offenderNo, securityReferredOffenders),
          }
        })
    } catch (error) {
      logger.error(error, 'Error during getRecategoriseOffenders')
      throw error
    }
  }

  async function mergeU21ResultWithNomisCategorisationData(nomisClient, agencyId, resultsU21IJ) {
    const eliteResultsRaw = await nomisClient.getLatestCategorisationForOffenders(
      resultsU21IJ.map(c => c.prisonerNumber),
    )

    // results can include inactive - need to remove
    const eliteResultsFiltered = eliteResultsRaw.filter(c => c.assessmentStatus !== 'I')

    return resultsU21IJ.map(u21 => {
      const categorisation = eliteResultsFiltered.find(o => o.bookingId === u21.bookingId)
      if (categorisation) {
        return {
          assessStatus: categorisation.assessmentStatus,
          offenderNo: u21.prisonerNumber,
          bookingId: u21.bookingId,
          firstName: u21.firstName,
          lastName: u21.lastName,
          dateOfBirth: u21.dateOfBirth,
        }
      }
      // todo investigate how this can happen
      logger.error(`No latest categorisation found for u21 offender ${u21.prisonerNumber} booking id: ${u21.bookingId}`)
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
    if (!sentenceDate) {
      return {}
    }
    const sentenceDateMoment = moment(sentenceDate, 'YYYY-MM-DD')
    const daysSinceSentence = moment().diff(sentenceDateMoment, 'days')

    const actualDays = get10BusinessDays(sentenceDateMoment)
    const dateRequiredRaw = sentenceDateMoment.add(actualDays, 'day')
    const dateRequired = dateRequiredRaw.format('DD/MM/YYYY')
    const now = moment(0, 'HH')
    const overdue = dateRequiredRaw.isBefore(now)
    const overdueText = getOverdueText(dateRequiredRaw)
    return { daysSinceSentence, dateRequired, sentenceDate, overdue, overdueText }
  }

  function getOverdueText(dateRequired) {
    const diffInDays = moment.utc().startOf('day').diff(moment.utc(dateRequired).startOf('day'), 'days')
    // eslint-disable-next-line no-nested-ternary
    return diffInDays > 1 ? `${diffInDays} days` : diffInDays === 1 ? '1 day' : ''
  }

  async function decorateWithCategorisationData(offender, user, nomisClient, categorisation) {
    let statusText
    if (categorisation?.status) {
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
        prisonId: result.prisonId ?? result.agencyId, // within prisoner search this is called prisonId
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
        await Promise.all(uniqueAgencies.map(async a => [a, await getOptionalAssessmentAgencyDescription(context, a)])),
      )

      const decoratedCats = await Promise.all(
        filteredCats.map(async o => {
          const description = agencyMap.get(o.assessmentAgencyId)
          return {
            ...o,
            agencyDescription: description,
            approvalDateDisplay: dateConverter(o.approvalDate),
          }
        }),
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
      await Promise.all(uniqueAgencies.map(async a => [a, await getOptionalAssessmentAgencyDescription(context, a)])),
    )

    const dataDecorated = await Promise.all(
      nomisRecords.map(async nomisRecord => {
        const foundCatRecord = catRecords.find(
          o => o.bookingId === nomisRecord.bookingId && o.nomisSeq === nomisRecord.assessmentSeq,
        )
        return {
          ...nomisRecord,
          prisonDescription: agencyMap.get(nomisRecord.assessmentAgencyId),
          recordExists: !!foundCatRecord,
          approvalDateDisplay: dateConverter(nomisRecord.approvalDate),
          sequence: foundCatRecord && foundCatRecord.sequence,
          tprsSelected: foundCatRecord?.formObject?.openConditions?.tprs?.tprsSelected === 'Yes' || false,
        }
      }),
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
        `Error during createOrUpdateCategorisation for booking id ${bookingId} and user ${context.user.username}`,
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
        `Error during createLiteCategorisation for booking id ${bookingId} and user ${context.user.username}`,
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
        `Error during createSupervisorApproval for booking id ${bookingId} and user ${context.user.username}`,
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
        `Recording cat ${supervisorCategory} approval for booking id ${bookingId} and user ${context.user.username}`,
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
        approvedCategoryComment,
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
        `Error during createLiteCategorisation for booking id ${bookingId} and user ${context.user.username}`,
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
        `Supervisor sent back categorisation record for bookingId: ${bookingId}, offender No: ${currentCategorisation.offenderNo}, user name: ${currentCategorisation.userId}`,
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
    if (/[BCDIJTR]/.test(classificationCodeFromNomis)) {
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

  function pnomisOrInconsistentWarning(dbRecord, pnomisStatus, liteInProgress) {
    if (liteInProgress) {
      return { requiresWarning: false, pnomis: 'OTHER' }
    }
    const inconsistent = inconsistentCategorisation(dbRecord, pnomisStatus)

    return {
      requiresWarning: inconsistent,
      pnomis: (inconsistent || (pnomisStatus === 'P' && (!dbRecord || !dbRecord.status))) && 'PNOMIS',
    }
  }

  function inconsistentCategorisation(dbRecord, pnomisStatus) {
    if (pnomisStatus === 'P') {
      // record is pending, valid status is AWAITING_APPROVAL OR SUPERVISOR_BACK OR SECURITY_BACK OR SECURITY_MANUAL
      return localStatusIsInconsistentWithNomisAwaitingApproval(dbRecord)
    }
    return dbRecord && Status.AWAITING_APPROVAL.name === dbRecord.status
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
          const { formRows, liteRows } = await formService.updateOffenderIdentifierReturningBookingId(
            from,
            to,
            transactionalDbClient,
          )
          await Promise.all(
            formRows.map(async r => {
              logger.info(
                `Merge: form row updated for bookingId ${r.booking_id}, changing offender no from ${from} to ${to}`,
              )
              const dbRecord = await formService.getCategorisationRecord(r.booking_id, transactionalDbClient)
              if (
                dbRecord.status === Status.AWAITING_APPROVAL.name ||
                dbRecord.status === Status.SUPERVISOR_BACK.name
              ) {
                logger.info(`Merge: form calling setInactive for ${r.booking_id}`)
                // The merge process may have copied an older active record to a higher seq no than the pending record
                await setInactive(context, r.booking_id, 'ACTIVE')
              }
            }),
          )
          await Promise.all(
            liteRows.map(async r => {
              logger.info(
                `Merge: lite row updated for bookingId ${r.booking_id}, changing offender no from ${from} to ${to}`,
              )
              const dbRecord = await formService.getLiteCategorisation(r.booking_id, transactionalDbClient)
              if (dbRecord.bookingId && !dbRecord.approvedDate) {
                logger.info(`Merge: lite calling setInactive for ${r.booking_id}`)
                // The merge process may have copied an older active record to a higher seq no than the pending record
                await setInactive(context, r.booking_id, 'ACTIVE')
              }
            }),
          )
        }),
    )
  }

  const handleExternalMovementEvent = async (
    context,
    bookingId,
    offenderNo,
    movementType,
    fromAgencyLocationId,
    toAgencyLocationId,
    client,
  ) => {
    logger.info(
      `Processing EXTERNAL_MOVEMENT_RECORD-INSERTED event for bookingId: ${bookingId}, offenderNo: ${offenderNo}, movementType: ${movementType} from: ${fromAgencyLocationId} to: ${toAgencyLocationId}`,
    )
    switch (movementType) {
      case 'ADM':
        {
          const results = []
          const dbRecord = await formService.getCategorisationRecord(bookingId, client)
          const prisonHasChanged = toAgencyLocationId !== dbRecord.prisonId
          if (inProgress(dbRecord) && prisonHasChanged) {
            const result = await formService.updatePrisonForm(bookingId, toAgencyLocationId, client)
            results.push({ name: 'form', ...result })
          }

          const assessmentData = await formService.getLiteCategorisation(bookingId, client)
          const liteInProgress = assessmentData.bookingId && !assessmentData.approvedDate
          const litePrisonHasChanged = toAgencyLocationId !== assessmentData.prisonId
          if (liteInProgress && litePrisonHasChanged) {
            const result = await formService.updatePrisonLite(bookingId, toAgencyLocationId, client)
            results.push({ name: 'lite', ...result })
          }

          if (offenderNo) {
            const resultRiskChange = await formService.updatePrisonRiskChange(offenderNo, toAgencyLocationId, client)
            const resultSecurity = await formService.updatePrisonSecurityReferral(
              offenderNo,
              toAgencyLocationId,
              client,
            )
            results.push({ name: 'riskChange', ...resultRiskChange })
            results.push({ name: 'securityReferral', ...resultSecurity })
          }
          logger.info(
            `Movement summary: rows updated =${results.reduce((s, item) => `${s} ${item.name}: ${item.rowCount}`, '')}`,
          )
        }
        break
      default:
        logger.debug(
          `Ignoring EXTERNAL_MOVEMENT_RECORD-INSERTED event for nomsId: ${bookingId}, movementType: ${movementType}`,
        )
        break
    }
  }

  return {
    getUncategorisedOffenders,
    getUnapprovedOffenders,
    getUnapprovedLite,
    getReferredOffenders,
    getUpcomingReferredOffenders,
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
    handleExternalMovementEvent,
    // just for tests:
    buildSentenceData,
    getMatchedCategorisations: matchEliteAndDBCategorisations,
    pnomisOrInconsistentWarning,
    calculateButtonStatus,
    mergeU21ResultWithNomisCategorisationData,
    mergeOffenderLists: mergeOffenderListsRemovingNulls,
    getOffenderDetailsWithNextReviewDate,
    isNextReviewAfterRelease,
    getReleaseDateMap,
    getPomMap,
    isInitialInProgress,
    statusTextDisplay,
    calculateRecatDisplayStatus,
    decorateWithCategorisationData,
    getDueRecats,
    getU21Recats,
    isAwaitingApprovalOrSecurity,
    isRejectedBySupervisorSuitableForDisplay,
  }
}
