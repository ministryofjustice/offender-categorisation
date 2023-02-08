package uk.gov.justice.digital.hmpps.cattool.model

import groovy.sql.Sql

import java.sql.Date

class DatabaseUtils {
  private static final Map dbConnParams = [
    url     : 'jdbc:postgresql://localhost:5432/form-builder',
    user    : 'form-builder',
    password: 'form-builder',
    driver  : 'org.postgresql.Driver']

  private static sql = Sql.newInstance(dbConnParams)

  def clearDb(UserAccount user) {
    sql.executeUpdate("delete from form where user_id = '${user.username}'")
    sql.executeUpdate("delete from security_referral")
    sql.executeUpdate("delete from risk_change")
  }

  def clearDb() {
    sql.executeUpdate("delete from form where booking_id < 1000")
    sql.executeUpdate("delete from security_referral")
    sql.executeUpdate("delete from risk_change")
    sql.executeUpdate("delete from lite_category")
    sql.executeUpdate("delete from next_review_change_history")
  }

  def getData(bookingId) {
    return sql.rows("select * from form where booking_id = $bookingId order by sequence_no")
  }

  def getLiteData(bookingId) {
    return sql.rows("select * from lite_category where booking_id = $bookingId order by sequence")
  }

  def createLiteCategorisation(bookingId, sequence, offenderNo, category, prisonId) {
    sql.executeUpdate("""
      insert into lite_category
        (booking_id,sequence,category,supervisor_category,offender_no,prison_id,created_date,approved_date,assessed_by,approved_by,assessment_committee,assessment_comment,next_review_date)
      values
        ($bookingId,$sequence,$category,$category,$offenderNo,$prisonId,current_timestamp(2),current_timestamp(2),'CATEGORISER_USER','SUPERVISOR_USER','',NULL,current_timestamp(2));
    """)
  }

  def createUnapprovedLiteCategorisation(bookingId, sequence, offenderNo, category, prisonId, assessedBy) {
    sql.executeUpdate("""
      insert into lite_category
        (booking_id,sequence,category,supervisor_category,offender_no,prison_id,created_date,approved_date,assessed_by,approved_by,assessment_committee,assessment_comment,next_review_date,placement_prison_id,approved_committee,approved_placement_prison_id,approved_placement_comment,approved_comment)
      values
        ($bookingId,$sequence,$category,NULL,$offenderNo,$prisonId,current_timestamp(2),NULL,$assessedBy,NULL,'',NULL,current_timestamp(2),NULL,NULL,NULL,NULL,NULL);
    """)
  }

  def getRiskChange(offenderNo) {
    return sql.rows("select * from risk_change where offender_no = $offenderNo")
  }

  def getNextReviewData(offenderNo) {
    return sql.rows("select * from next_review_change_history where offender_no = $offenderNo")
  }

  def createData(bookingId, json) {
    doCreateData(-1, bookingId, 'STARTED', json)
  }

  def createDataWithStatus(bookingId, status, json) {
    doCreateData(-1, bookingId, status, json)
  }

  def createDataWithStatusWomen(id, bookingId, status, json, userId, prisonId) {
    doCreateCompleteRow(id, bookingId, json, 'FEMALE_USER', status, 'INITIAL', null, null, null, 1, null, 'PFI', 'dummy', 'current_timestamp(2)', null, null)
  }

  def createDataWithStatusAndCatType(bookingId, status, json, catType, offenderNo = 'dummy') {
    createDataWithIdAndStatusAndCatType(-1, bookingId, status, json, catType, offenderNo)
  }


  def createDataWithIdAndStatusAndCatType(id, bookingId, status, json, catType, offenderNo = 'dummy') {
    def userId = catType == 'RECAT' ? 'RECATEGORISER_USER' : 'CATEGORISER_USER'
    doCreateCompleteRow(id, bookingId, json, userId, status, catType, null, null, null, 1, null, 'LEI', offenderNo, 'current_timestamp(2)', null, null)
  }

  def createDataWithIdAndStatusAndCatTypeAndSeq(id, bookingId, status, json, catType, offenderNo = 'dummy', seq) {
    def userId = catType == 'RECAT' ? 'RECATEGORISER_USER' : 'CATEGORISER_USER'
    doCreateCompleteRow(id, bookingId, json, userId, status, catType, null, null, null, seq, null, 'LEI', offenderNo, 'current_timestamp(2)', null, null)
  }

  def createApprovedCategorisationWithSeqAndApprovalDate(id, bookingId, json, catType, offenderNo = 'dummy', seq, approvalDate) {
    def userId = catType == 'RECAT' ? 'RECATEGORISER_USER' : 'CATEGORISER_USER'
    doCreateCompleteRow(id, bookingId, json, userId, 'APPROVED', catType, null, null, null, seq, null, 'LEI', offenderNo, 'current_timestamp(2)', null, null, approvalDate)
  }

  def createRiskProfileData(bookingId, json) {
    doCreateCompleteRow(-1, bookingId, null, 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null, 1, json, 'LEI', 'dummy', 'current_timestamp(2)', null, null)
  }



  def createRiskProfileDataForExistingRow(bookingId, json) {
    sql.executeUpdate("update form set risk_profile = ?::JSON where booking_id = $bookingId", json)
  }

  def createNomisSeqNo(bookingId, nomisSeq, existingSeq = 1) {
    sql.executeUpdate("update form set nomis_sequence_no = $nomisSeq where booking_id = $bookingId and sequence_no = $existingSeq")
  }

  def createNomisSeqNoWhenMultipleCategorisationsForOffender(bookingId, seq, nomisSeq) {
    sql.executeUpdate("update form set nomis_sequence_no = $nomisSeq where booking_id = $bookingId and sequence_no = $seq")
  }

  def createReviewReason(int bookingId, String reason) {
    sql.executeUpdate("update form set review_reason = $reason::review_reason_enum where booking_id = $bookingId")
  }

  def updateStatus(int bookingId, String status) {
    sql.executeUpdate("update form set status = '$status' where booking_id = $bookingId")
  }

  def createDataWithStatus(id, bookingId, status, json) {
    doCreateData(id, bookingId, status, json)
  }



  def createSecurityReviewedData(id, bookingId, offenderNo, status, json, reviewedBy, reviewDate, catType = 'INITIAL') {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, catType, null, null, null, 1, null, 'LEI', offenderNo, 'current_timestamp(2)', reviewedBy, reviewDate)
  }

  private doCreateData(id, bookingId, status, json) {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, 'INITIAL', null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', null, null)

  }

  def doCreateCompleteRow(id, bookingId, json, userId, status, catType, assignedUserId, referredDate, referredBy, seq, riskProfile, prisonId, offenderNo, startDate,
                          securityReviewedBy, securityReviewedDate, approvalDate = null, assessmentDate = null, dueByDate = null, approvedBy = null, reviewReason = 'DUE') {

    def approvalDateDB = approvalDate != null ? approvalDate : status == 'APPROVED' ? new Date(Calendar.getInstance().getTimeInMillis()) : null
    def approvedByDB = approvedBy != null ? approvedBy : status == 'APPROVED' ? 'SUPERVISOR_USER' : null
    sql.executeUpdate("""insert into form values ($id, ?::JSON, $bookingId, '$assignedUserId', '$status', '$userId', $referredDate, '$referredBy',
      $seq, ?::JSON, '$prisonId', '$offenderNo', $startDate, '$securityReviewedBy', $securityReviewedDate, ?::date, '$catType', null, ?::date, ?::text, null, '$reviewReason', ?::date)""",
      json, riskProfile, approvalDateDB, assessmentDate, approvedByDB, dueByDate)
  }

  def createSecurityData(offenderNo, prisonId = 'LEI', id = -1, status = 'NEW') {
    sql.executeUpdate("insert into security_referral values ($id, '$offenderNo', 'SECURITY_USER', $prisonId, $status::security_referral_status_enum, current_timestamp(2))")
  }

  def getSecurityData(offenderNo) {
    return sql.rows("select * from security_referral where offender_no = $offenderNo")
  }

  def createRiskChange(id, offenderNo, userId, status, riskProfileOld, riskProfileNew, prisonId, raisedDate) {
    sql.executeUpdate("""insert into risk_change (id, old_profile, new_profile, offender_no, user_id, prison_id, status, raised_date ) values ($id, ?::JSON, ?::JSON, '$offenderNo', '$userId', '$prisonId', '$status', '$raisedDate' )""",
      riskProfileOld, riskProfileNew)
  }
}
