package uk.gov.justice.digital.hmpps.cattool.pages

class DashboardInitialPage extends DashboardPage {

  static url = '/dashboardInitial'

  static at = {
    headingText == 'Initial categorisations statistics'
  }

  static content = {
    numbersTableRows { $('#initialTable > tbody > tr') }
    statsTypeOptions { $('#scope option') }
  }
}
