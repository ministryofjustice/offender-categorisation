package uk.gov.justice.digital.hmpps.cattool.pages

class DashboardInitialPage extends DashboardPage {

  static url = '/dashboardInitial'

  static at = {
    headingText == 'Dashboard - Initial categorisations'
  }

  static content = {
    numbersTableRows { $('#initialTable > tbody > tr') }
  }
}
