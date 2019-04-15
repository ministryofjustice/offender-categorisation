package uk.gov.justice.digital.hmpps.cattool.model

import groovy.sql.Sql

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
    sql.executeUpdate("delete from form ")
  }

  def getData(bookingId) {
    def sql = Sql.newInstance(dbConnParams)
    return sql.rows("select * from form where booking_id = $bookingId")
  }

  def createData(bookingId, json) {
    doCreateData(-1, bookingId, 'STARTED', json)
  }

  def createDataWithStatus(bookingId, status, json) {
    doCreateData(-1, bookingId, status, json)
  }

  def createData(id, bookingId, json) {
    doCreateData(id, bookingId, 'STARTED', json)
  }

  def createDataWithStatus(id, bookingId, status, json) {
    doCreateData(id, bookingId, status, json)
  }

  def createSecurityReviewedData(id, bookingId, status, json, reviewedBy, reviewDate) {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', reviewedBy, reviewDate)
  }

  private doCreateData(id, bookingId, status, json) {
    doCreateCompleteRow(id, bookingId, json, 'CATEGORISER_USER', status, null, null, null, 1, null, 'LEI', 'dummy', 'current_timestamp(2)', null, null)
  }

  private doCreateCompleteRow(id, bookingId, json, userId, status, assignedUserId, referredDate, referredBy, seq, riskProfile, prisonId, offenderNo, startDate, securityReviewedBy, securityReviewedDate) {
    def sql = Sql.newInstance(dbConnParams)
    sql.executeUpdate("insert into form values ($id, ?::JSON, $bookingId, '$assignedUserId', '$status', '$userId', $referredDate, '$referredBy',$seq, $riskProfile, '$prisonId', '$offenderNo', $startDate, '$securityReviewedBy', ?::date)", json, securityReviewedDate)
  }
}
