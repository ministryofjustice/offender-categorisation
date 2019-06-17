package uk.gov.justice.digital.hmpps.cattool.model

import groovy.sql.Sql

import java.sql.Date

class DatabaseUtils {
  Map dbConnParams = [
    url: 'jdbc:postgresql://localhost:5432/form-builder',
    user: 'form-builder',
    password: 'form-builder',
    driver: 'org.postgresql.Driver']

  def clearDb(UserAccount user) {

    def sql = Sql.newInstance(dbConnParams)
    sql.executeUpdate("delete from form where user_id = '${user.username}'")
  }

  def clearDb() {

    def sql = Sql.newInstance(dbConnParams)
    sql.executeUpdate("delete from form where booking_id < 1000")
  }

  def getData(bookingId) {
    def sql = Sql.newInstance(dbConnParams)
    return sql.rows("select * from form where booking_id = $bookingId order by sequence_no")
  }

  def createData(bookingId, json) {
    doCreateData(-1, bookingId, 'STARTED', json)
  }

  def createDataWithStatus(bookingId, status, json) {
    doCreateData(-1, bookingId, status, json)
  }

  def createDataWithStatusAndCatType(bookingId, status, json, catType) {
    def userId = catType == 'RECAT' ? 'RECATEGORISER_USER' : 'CATEGORISER_USER'
    doCreateCompleteRow(-1, bookingId, json, userId, status, catType, null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', null, null)
  }

  def createData(id, bookingId, json) {
    doCreateData(id, bookingId, 'STARTED', json)
  }

  def createRiskProfileData(bookingId, json) {
    doCreateCompleteRow(-1, bookingId, null, 'CATEGORISER_USER', 'STARTED', 'INITIAL', null, null, null, 1, json, 'LEI', 'dummy', 'current_timestamp(2)', null, null)
  }

  def createDataWithStatus(id, bookingId, status, json) {
    doCreateData(id, bookingId, status, json)
  }

  def createSecurityReviewedData(id, bookingId, status, json, reviewedBy, reviewDate) {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, 'INITIAL', null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', reviewedBy, reviewDate)
  }

  private doCreateData(id, bookingId, status, json) {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, 'INITIAL', null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', null, null)
  }

  private doCreateCompleteRow(id, bookingId, json, userId, status, catType, assignedUserId, referredDate, referredBy, seq, riskProfile, prisonId, offenderNo, startDate, securityReviewedBy, securityReviewedDate) {
    def sql = Sql.newInstance(dbConnParams)
    def approvalDate = status == 'APPROVED' ? new Date(Calendar.getInstance().getTimeInMillis()) : null
    sql.executeUpdate("""insert into form values ($id, ?::JSON, $bookingId, '$assignedUserId', '$status', '$userId',
      $referredDate, '$referredBy', $seq, ?::JSON, '$prisonId', '$offenderNo', $startDate, '$securityReviewedBy', ?::date, ?::date, '$catType')""",
      json, riskProfile, securityReviewedDate, approvalDate)
  }
}
