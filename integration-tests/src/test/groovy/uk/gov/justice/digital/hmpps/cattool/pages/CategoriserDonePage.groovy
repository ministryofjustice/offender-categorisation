package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserDonePage extends Page {

  static url = '/categoriserDone'

  static at = {
    headingText == 'Prisoner Categorisation'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    prisonNos { bodyRows*.$('td', 1)*.text()  }
    approvalDates { bodyRows*.$('td', 2)*.text()  }
    categorisers { bodyRows*.$('td', 3)*.text()  }
    approvers { bodyRows*.$('td', 4)*.text()  }
    viewButtons { bodyRows*.$('td', 5)*.find('*')  }
    todoTabLink { $('a', href: '/categoriserHome')}
    noResultsDiv { $('#no-results-message') }
  }

  def logout() {
    logoutLink.click()
  }

  def selectFirstPrisoner() {
    viewButtons[0].click()
  }
}
