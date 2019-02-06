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
}
