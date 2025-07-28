const logger = require('../../log')
const Status = require('../utils/statusEnum')
const db = require('./dataAccess/db')

const selectClause = `select id,
                    booking_id             as "bookingId",
                    offender_no            as "offenderNo",
                    sequence_no            as "sequence",
                    user_id                as "userId",
                    status,
                    form_response          as "formObject",
                    risk_profile           as "riskProfile",
                    assigned_user_id       as "assignedUserId",
                    referred_date          as "securityReferredDate",
                    referred_by            as "securityReferredBy",
                    security_reviewed_date as "securityReviewedDate",
                    security_reviewed_by   as "securityReviewedBy",
                    approval_date          as "approvalDate",
                    prison_id              as "prisonId",
                    cat_type               as "catType",
                    review_reason          as "reviewReason",
                    nomis_sequence_no      as "nomisSeq"`

const ignoreCancelledClause = `and f.status <> 'CANCELLED' and f.status <> '${Status.CANCELLED_RELEASE.name}'`

const sequenceClause = `and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and f2.status <> 'CANCELLED' and f2.status <> '${Status.CANCELLED_RELEASE.name}')`

const sequenceClauseIncludeCancelled = `and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id)`

module.exports = {
  getFormDataForUser(bookingId, transactionalClient = db) {
    const query = {
      text: `${selectClause} from form f where f.booking_id = $1 ${sequenceClause}`,
      values: [bookingId],
    }
    return transactionalClient.query(query)
  },

  getFormDataUsingSequence(bookingId, sequenceNo, transactionalClient) {
    logger.debug(`getFormDataUsingSequence called for ${bookingId}, sequenceNo ${sequenceNo}`)
    const query = {
      text: `${selectClause} from form f where f.booking_id = $1 and f.sequence_no = $2 ${ignoreCancelledClause} `,
      values: [bookingId, sequenceNo],
    }
    return transactionalClient.query(query)
  },

  getHistoricalFormData(offenderNo, transactionalClient) {
    logger.debug(`getHistoricalFormData called for ${offenderNo}`)
    const query = {
      text: `select booking_id    as "bookingId",
                    offender_no   as "offenderNo",
                    sequence_no   as "sequence",
                    approval_date as "approvalDate",
                    form_response as "formObject",
                    prison_id     as "prisonId",
                    nomis_sequence_no as "nomisSeq"
             from form f
             where f.offender_no = $1 and f.status = 'APPROVED'
             ${ignoreCancelledClause}
             order by sequence_no`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  getCategorisationRecordsByStatus(agencyId, statusList, transactionalClient = db) {
    logger.debug(`getCategorisationRecordsByStatus called for ${agencyId}, status ${statusList}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType", prison_id as prisonId
        from form f where f.prison_id = $1 and f.status = ANY ($2) ${sequenceClauseIncludeCancelled}`,
      values: [agencyId, statusList],
    }
    return transactionalClient.query(query)
  },

  getCategorisationRecords(agencyId, statusList, catType, reviewReason, transactionalClient = db) {
    logger.debug(`getCategorisationRecords called for ${agencyId}, status ${statusList}, type ${catType}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType", prison_id as prisonId
        from form f where f.prison_id = $1 and f.status = ANY ($2) and f.cat_type = $3 and f.review_reason = $4 ${sequenceClauseIncludeCancelled}`,
      values: [agencyId, statusList, catType, reviewReason],
    }
    return transactionalClient.query(query)
  },

  getApprovedCategorisations(agencyId, fromDate, catType, transactionalClient) {
    logger.debug(`getApprovedCategorisations called for ${agencyId}, date ${fromDate}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", approved_by as "approvedBy", offender_no as "offenderNo", cat_type as "catType", nomis_sequence_no as "nomisSeq", sequence_no as "sequence"
        from form f where f.prison_id = $1 and f.status = $2 and f.approval_date >= $3 and ($4::cat_type_enum is null or f.cat_type = $4::cat_type_enum) and f.status <> 'CANCELLED' and f.status <> '${Status.CANCELLED_RELEASE.name}'`,
      values: [agencyId, 'APPROVED', fromDate, catType],
    }
    return transactionalClient.query(query)
  },

  getSecurityReviewedCategorisationRecords(agencyId, transactionalClient) {
    logger.debug(`getSecurityReviewedCategorisationRecords called for ${agencyId}`)
    const query = {
      text: `select id, booking_id as "bookingId", user_id as "userId", status, form_response as "formObject", assigned_user_id as "assignedUserId", referred_date as "securityReferredDate", referred_by as "securityReferredBy", security_reviewed_date as "securityReviewedDate", security_reviewed_by as "securityReviewedBy", approval_date as "approvalDate", offender_no as "offenderNo", cat_type as "catType"
        from form f where f.prison_id = $1 and f.security_reviewed_date is not null ${sequenceClause}`,
      values: [agencyId],
    }
    return transactionalClient.query(query)
  },

  getRiskChangeByStatus(agencyId, status, transactionalClient = db) {
    logger.debug(`getRiskChangeByStatus called with status ${status} and agencyId ${agencyId}`)
    const query = {
      text: `select offender_no as "offenderNo", user_id as "userId", status, raised_date as "raisedDate" from risk_change f where f.prison_id= $1 and f.status = $2`,
      values: [agencyId, status],
    }
    return transactionalClient.query(query)
  },

  getNewRiskChangeByOffender(offenderNo, transactionalClient) {
    logger.debug(`getRiskChangeByStatus called with offenderNo ${offenderNo}`)
    const query = {
      text: `select old_profile as "oldProfile", new_profile as "newProfile", status, raised_date as "raisedDate" from risk_change r where r.offender_no= $1 and r.status = 'NEW'`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  mergeRiskChangeForOffender(offenderNo, newProfile, transactionalClient) {
    logger.info(`mergeRiskChangeForOffender called with offenderNo ${offenderNo}`)
    const query = {
      text: `update risk_change set new_profile = $2, raised_date = CURRENT_TIMESTAMP where offender_no= $1 and status = 'NEW'`,
      values: [offenderNo, newProfile],
    }
    return transactionalClient.query(query)
  },

  referToSecurity(bookingId, userId, status, transactionalClient) {
    logger.info(`referToSecurity called for ${userId}, status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set status = $1, referred_date = CURRENT_TIMESTAMP, referred_by = $2 where f.booking_id = $3 ${sequenceClause}`,
      values: [status, userId, bookingId],
    }
    return transactionalClient.query(query)
  },

  securityReviewed(bookingId, status, userId, transactionalClient) {
    logger.info(`securityReviewed called for ${userId} with status ${status} and booking id ${bookingId}`)
    const query = {
      text: `update form f set security_reviewed_date = CURRENT_TIMESTAMP, security_reviewed_by = $1, status = $2 where f.booking_id = $3 ${sequenceClause}`,
      values: [userId, status, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateStatus(bookingId, status, transactionalClient) {
    logger.info(`updateStatus called for booking id ${bookingId} and status ${status}`)
    const query = {
      text: `update form f set status = $1 where f.booking_id = $2 ${sequenceClause}`,
      values: [status, bookingId],
    }
    return transactionalClient.query(query)
  },

  updatePrisonForm(bookingId, prisonId, transactionalClient) {
    logger.info(`updatePrisonForm called for booking id ${bookingId} and status ${prisonId}`)
    const query = {
      text: `update form f set prison_id = $1 where f.booking_id = $2 ${sequenceClause}`,
      values: [prisonId, bookingId],
    }
    return transactionalClient.query(query)
  },

  updatePrisonLite(bookingId, prisonId, transactionalClient) {
    logger.info(`updatePrisonForm called for booking id ${bookingId} and status ${prisonId}`)
    const query = {
      text: `update lite_category c
             set prison_id = $1
             where c.booking_id = $2
               and c.sequence = (select max(c2.sequence) from lite_category c2 where c2.booking_id = c.booking_id)`,
      values: [prisonId, bookingId],
    }
    return transactionalClient.query(query)
  },

  updatePrisonRiskChange(offenderNo, prisonId, transactionalClient) {
    logger.info(`updatePrisonRiskChange called for offenderNo ${offenderNo} and status ${prisonId}`)
    const query = {
      text: `update risk_change c
             set prison_id = $1
             where c.offender_no = $2
               and c.status = 'NEW'`,
      values: [prisonId, offenderNo],
    }
    return transactionalClient.query(query)
  },

  updatePrisonSecurityReferral(offenderNo, prisonId, transactionalClient) {
    logger.info(`updatePrisonSecurityReferral called for offenderNo ${offenderNo} and status ${prisonId}`)
    const query = {
      text: `update security_referral c
             set prison_id = $1
             where c.offender_no = $2
               and c.status = 'NEW'`,
      values: [prisonId, offenderNo],
    }
    return transactionalClient.query(query)
  },

  updateRecordWithNomisSeqNumber(bookingId, seq, transactionalClient = db) {
    logger.info(`updateRecordWithNomisSeqNumber called for booking id ${bookingId} and seq ${seq}`)
    const query = {
      text: `update form f set nomis_sequence_no = $1 where f.booking_id = $2 ${sequenceClause}`,
      values: [seq, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateFormData(bookingId, formResponse, transactionalClient = db) {
    logger.info(`updateFormData for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1 where f.booking_id = $2 ${sequenceClause}`,
      values: [formResponse, bookingId],
    }
    return transactionalClient.query(query)
  },

  updateRiskProfileData(bookingId, data, transactionalClient = db) {
    logger.info(`updateRiskProfileData called for booking id ${bookingId}`)
    const query = {
      text: `update form f set risk_profile = $1 where f.booking_id = $2 ${sequenceClause}`,
      values: [data, bookingId],
    }
    return transactionalClient.query(query)
  },

  cancel(bookingId, user, transactionalClient) {
    logger.info(`cancel called for booking id ${bookingId} and user ${user}`)
    const query = {
      text: `update form f set status = $1, cancelled_by = $2, cancelled_date = CURRENT_TIMESTAMP where f.booking_id = $3 ${sequenceClause}`,
      values: [Status.CANCELLED.name, user, bookingId],
    }
    return transactionalClient.query(query)
  },

  supervisorApproval(formResponse, bookingId, userId, transactionalClient = db) {
    logger.info(`recording supervisor approval for booking id ${bookingId} and user ${userId}`)
    const query = {
      text: `update form f set form_response = $1, status = $2, approved_by = $3, approval_date = CURRENT_DATE where f.booking_id = $4 ${sequenceClause}`,
      values: [formResponse, 'APPROVED', userId, bookingId],
    }
    return transactionalClient.query(query)
  },

  categoriserDecisionWithFormResponse(formResponse, bookingId, userId, transactionalClient) {
    logger.info(`recording assessment decision (awaiting approval) for booking id ${bookingId} and user ${userId}`)
    const query = {
      text: `update form f set form_response = $1, status = $2, assessed_by = $3, assessment_date = CURRENT_DATE where f.booking_id = $4 ${sequenceClause}`,
      values: [formResponse, 'AWAITING_APPROVAL', userId, bookingId],
    }
    return transactionalClient.query(query)
  },

  categoriserDecision(bookingId, userId, transactionalClient) {
    logger.info(`recording assessment decision (awaiting approval) for booking id ${bookingId} and user ${userId}`)
    const query = {
      text: `update form f set status = $1, assessed_by = $2, assessment_date = CURRENT_DATE where f.booking_id = $3 ${sequenceClause}`,
      values: ['AWAITING_APPROVAL', userId, bookingId],
    }
    return transactionalClient.query(query)
  },

  update(formResponse, bookingId, status, transactionalClient = db) {
    logger.info(`updating record for booking id ${bookingId}`)
    const query = {
      text: `update form f set form_response = $1, status = $2 where f.booking_id = $3 ${sequenceClause}`,
      values: [formResponse, status, bookingId],
    }
    return transactionalClient.query(query)
  },

  createRiskChange({ agencyId, offenderNo, oldProfile, newProfile, transactionalClient }) {
    logger.info(`creating risk_change record for offender no ${offenderNo}`)
    const query = {
      text: `insert into risk_change ( prison_id, offender_no, old_profile, new_profile, raised_date ) values ($1, $2, $3, $4, CURRENT_TIMESTAMP )`,
      values: [agencyId, offenderNo, oldProfile, newProfile],
    }
    return transactionalClient.query(query)
  },

  updateNewRiskChangeStatus({ offenderNo, userId, status, transactionalClient }) {
    logger.info(`updating risk_change status for offender no  ${offenderNo} with status ${status}`)
    const query = {
      text: `update risk_change set status = $1, user_id = $2 where offender_no = $3 and status = 'NEW'`,
      values: [status, userId, offenderNo],
    }
    return transactionalClient.query(query)
  },

  createSecurityReferral({ agencyId, offenderNo, userId, transactionalClient }) {
    logger.info(`creating security_referral record for ${offenderNo}`)
    const query = {
      text: `insert into security_referral ( prison_id, offender_no, user_id, raised_date )
        values ($1, $2, $3, CURRENT_TIMESTAMP )
        on conflict (offender_no) do update set prison_id=$1, user_id=$3, status='NEW', raised_date=CURRENT_TIMESTAMP, processed_date=null`,
      values: [agencyId, offenderNo, userId],
    }
    return transactionalClient.query(query)
  },

  getSecurityReferral(offenderNo, transactionalClient) {
    logger.debug(`getSecurityReferral called with offenderNo ${offenderNo}`)
    const query = {
      text: `select prison_id   as "prisonId",
                    user_id     as "userId",
                    status,
                    raised_date as "raisedDate"
             from security_referral
             where offender_no = $1`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  getSecurityReferrals(agencyId, transactionalClient = db) {
    logger.debug(`getSecurityReferrals called with agencyId ${agencyId}`)
    const query = {
      text: `select prison_id   as "prisonId",
                    user_id     as "userId",
                    status,
                    raised_date as "raisedDate",
                    offender_no as "offenderNo",
                    processed_date as "processedDate"
             from security_referral s
             where prison_id = $1 `,
      values: [agencyId],
    }
    return transactionalClient.query(query)
  },

  setSecurityReferralProcessed(offenderNo, transactionalClient) {
    logger.info(`setSecurityReferralProcessed for ${offenderNo}`)
    const query = {
      text: `update security_referral set status='REFERRED', processed_date=CURRENT_TIMESTAMP where offender_no=$1`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  setSecurityReferralStatus(offenderNo, status, transactionalClient = db) {
    logger.info(`setSecurityReferralStatus for ${offenderNo} to ${status}`)
    const query = {
      text: `update security_referral set status=$2 where offender_no=$1`,
      values: [offenderNo, status],
    }
    return transactionalClient.query(query)
  },

  setSecurityReferralNotProcessed(offenderNo, transactionalClient) {
    logger.info(`setSecurityReferralNotProcessed for ${offenderNo}`)
    const query = {
      text: `update security_referral set status='NEW', processed_date=null where offender_no=$1 and status='REFERRED'`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  updateOffenderIdentifierReturningBookingIdForm(oldOffenderNo, newOffenderNo, transactionalClient) {
    logger.info(`updateOffenderIdentifierReturningBookingIdForm from ${oldOffenderNo} to ${newOffenderNo}`)
    const query = {
      text: `update form set offender_no=$2 where offender_no=$1 returning booking_id`,
      values: [oldOffenderNo, newOffenderNo],
    }
    return transactionalClient.query(query)
  },

  updateOffenderIdentifierReturningBookingIdLite(oldOffenderNo, newOffenderNo, transactionalClient) {
    logger.info(`updateOffenderIdentifierReturningBookingIdLite from ${oldOffenderNo} to ${newOffenderNo}`)
    const query = {
      text: `update lite_category set offender_no=$2 where offender_no=$1 returning booking_id`,
      values: [oldOffenderNo, newOffenderNo],
    }
    return transactionalClient.query(query)
  },

  updateOffenderIdentifierRiskChange(oldOffenderNo, newOffenderNo, transactionalClient) {
    logger.info(`updateOffenderIdentifierRiskChange from ${oldOffenderNo} to ${newOffenderNo}`)
    const query = {
      text: `update risk_change set offender_no=$2 where offender_no=$1`,
      values: [oldOffenderNo, newOffenderNo],
    }
    return transactionalClient.query(query)
  },

  updateOffenderIdentifierSecurityReferral(oldOffenderNo, newOffenderNo, transactionalClient) {
    logger.info(`updateOffenderIdentifierSecurityReferral from ${oldOffenderNo} to ${newOffenderNo}`)
    const query = {
      text: `update security_referral set offender_no=$2 where offender_no=$1`,
      values: [oldOffenderNo, newOffenderNo],
    }
    return transactionalClient.query(query)
  },

  deleteSecurityReferral(offenderNo, transactionalClient) {
    logger.info(`deleting security_referral record for offenderNo ${offenderNo}`)
    const query = {
      text: `delete from security_referral where offender_no=$1`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  create({
    bookingId,
    catType,
    userId,
    status,
    assignedUserId,
    prisonId,
    offenderNo,
    reviewReason,
    dueByDate,
    transactionalClient,
  }) {
    logger.info(`creating categorisation record for booking id ${bookingId}, offenderNo ${offenderNo}`)
    const query = {
      text: `insert into form (
              form_response, booking_id, user_id, status, assigned_user_id, sequence_no, prison_id, offender_no, start_date, cat_type, review_reason, due_by_date
             ) values ($1, $2, $3, $4, $5, (
              select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $2
                 ), $6, $7, CURRENT_TIMESTAMP, $8, $9, $10
             )`,
      values: [{}, bookingId, userId, status, assignedUserId, prisonId, offenderNo, catType, reviewReason, dueByDate],
    }
    return transactionalClient.query(query)
  },

  recordLiteCategorisation({
    bookingId,
    sequence,
    category,
    offenderNo,
    prisonId,
    assessmentCommittee,
    assessmentComment,
    nextReviewDate,
    placementPrisonId,
    assessedBy,
    transactionalClient,
  }) {
    logger.info(`creating lite categorisation record for booking id ${bookingId}, offenderNo ${offenderNo}`)
    const query = {
      text: `insert into lite_category (booking_id, sequence, category, offender_no, prison_id, assessment_committee,
                                        assessment_comment, next_review_date, placement_prison_id, created_date, assessed_by)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)`,
      values: [
        bookingId,
        sequence,
        category,
        offenderNo,
        prisonId,
        assessmentCommittee,
        assessmentComment,
        nextReviewDate,
        placementPrisonId,
        assessedBy,
      ],
    }
    return transactionalClient.query(query)
  },

  getLiteCategorisation(bookingId, transactionalClient = db) {
    const query = {
      text: `select booking_id           as "bookingId",
                    sequence,
                    category,
                    supervisor_category  as "supervisorCategory",
                    offender_no          as "offenderNo",
                    prison_id            as "prisonId",
                    assessment_committee as "assessmentCommittee",
                    assessment_comment   as "assessmentComment",
                    next_review_date     as "nextReviewDate",
                    placement_prison_id  as "placementPrisonId",
                    created_date         as "createdDate",
                    approved_date        as "approvedDate",
                    assessed_by          as "assessedBy",
                    approved_by          as "approvedBy"
             from lite_category c
             where c.booking_id = $1
               and c.sequence = (select max(c2.sequence) from lite_category c2 where c2.booking_id = c.booking_id)`,
      values: [bookingId],
    }
    return transactionalClient.query(query)
  },

  getUnapprovedLite(prisonId, transactionalClient = db) {
    const query = {
      text: `select booking_id          as "bookingId",
                    sequence,
                    category,
                    offender_no         as "offenderNo",
                    prison_id           as "prisonId",
                    created_date        as "createdDate",
                    assessed_by         as "assessedBy"
             from lite_category c
             where c.prison_id = $1 and approved_date is null`,
      values: [prisonId],
    }
    return transactionalClient.query(query)
  },

  approveLiteCategorisation({
    bookingId,
    sequence,

    approvedDate,
    approvedBy,
    supervisorCategory,
    approvedCommittee,
    nextReviewDate,
    approvedPlacement,
    approvedPlacementComment,
    approvedComment,
    approvedCategoryComment,
    transactionalClient,
  }) {
    logger.info(`lite categorisation record for booking id ${bookingId} and user ${approvedBy}`)
    const query = {
      text: `update lite_category
             set approved_date                = $3,
                 approved_by                  = $4,
                 supervisor_category          = $5,
                 approved_committee           = $6,
                 next_review_date             = $7,
                 approved_placement_prison_id = $8,
                 approved_placement_comment   = $9,
                 approved_comment             = $10,
                 approved_category_comment    = $11
             where booking_id = $1
               and sequence = $2`,
      values: [
        bookingId,
        sequence,
        approvedDate,
        approvedBy,
        supervisorCategory,
        approvedCommittee,
        nextReviewDate,
        approvedPlacement,
        approvedPlacementComment,
        approvedComment,
        approvedCategoryComment,
      ],
    }
    return transactionalClient.query(query)
  },

  deleteLiteCategorisation({ bookingId, sequence, transactionalClient }) {
    logger.info(`deleting lite categorisation record for booking id ${bookingId} and sequence ${sequence}`)
    const query = {
      text: `delete from lite_category where booking_id = $1 and sequence = $2`,
      values: [bookingId, sequence],
    }
    return transactionalClient.query(query)
  },

  recordNextReview({ bookingId, offenderNo, nextReviewDate, reason, user, transactionalClient }) {
    logger.info(`creating next_review_change_history record for booking id ${bookingId}, offenderNo ${offenderNo}`)
    const query = {
      text: `insert into next_review_change_history (booking_id, offender_no, next_review_date, reason, change_date, changed_by)
             values ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
      values: [bookingId, offenderNo, nextReviewDate, reason, user],
    }
    return transactionalClient.query(query)
  },

  getNextReview(offenderNo, transactionalClient) {
    const query = {
      text: `select id,
                    booking_id          as "bookingId",
                    offender_no         as "offenderNo",
                    next_review_date    as "nextReviewDate",
                    reason,
                    change_date         as "changeDate",
                    changed_by          as "changedBy"
             from next_review_change_history c
             where c.offender_no = $1
             order by next_review_date desc`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  getPendingCategorisations(offenderNo, transactionalClient) {
    logger.info(`get pending categorisations for offenderNo ${offenderNo}`)
    const query = {
      text: `select f.id, f.booking_id, f.status, f.cat_type
             from form f
             where f.offender_no = $1
             and f.approval_date is null
             and f.approved_by is null
             and f.status in (
                '${Status.UNCATEGORISED.name}',
                '${Status.STARTED.name}',
                '${Status.SECURITY_MANUAL.name}',
                '${Status.SECURITY_AUTO.name}',
                '${Status.SECURITY_FLAGGED.name}',
                '${Status.SECURITY_BACK.name}',
                '${Status.AWAITING_APPROVAL.name}',
                '${Status.SUPERVISOR_BACK.name}'
             );`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  getPendingLiteCategorisations(offenderNo, transactionalClient) {
    logger.info(`get pending lite categorisations for offenderNo ${offenderNo}`)
    const query = {
      text: `select lc.booking_id, lc.sequence
             from public.lite_category lc
             where lc.offender_no = $1
             and lc.approved_date is null
             and lc.approved_by is null;`,
      values: [offenderNo],
    }
    return transactionalClient.query(query)
  },

  deleteCategorisation(categorisationId, transactionalClient) {
    logger.info(`deleting categorisation record ${categorisationId}`)
    const query = {
      text: `delete from form f where f.id=$1`,
      values: [categorisationId],
    }
    return transactionalClient.query(query)
  },
}
