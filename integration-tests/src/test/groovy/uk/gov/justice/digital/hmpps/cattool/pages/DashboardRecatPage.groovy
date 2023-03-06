package uk.gov.justice.digital.hmpps.cattool.pages

class DashboardRecatPage extends DashboardPage {

  static url = '/dashboardRecat'

  static at = {
    headingText == 'Recategorisation statistics'
  }

  static content = {
    reviewNumbersTableRows { $('#reviewNumbersTable > tbody > tr') }
    numbersTableRows { $('#recatTable > tbody > tr') }
    statsTypeOptions { $('#scope option') }
  }
}
