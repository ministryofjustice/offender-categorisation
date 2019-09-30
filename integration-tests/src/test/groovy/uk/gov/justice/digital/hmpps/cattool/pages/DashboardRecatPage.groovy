package uk.gov.justice.digital.hmpps.cattool.pages

class DashboardRecatPage extends DashboardPage {

  static url = '/dashboardRecat'

  static at = {
    headingText == 'Dashboard - Categorisation reviews'
  }

  static content = {
    numbersTableRows { $('#recatTable > tbody > tr') }
  }
}
