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
    approvalDates { bodyRows*.$('td', 1)*.text()  }
    categorisers { bodyRows*.$('td', 2)*.text()  }
    approvers { bodyRows*.$('td', 3)*.text()  }
    viewButtons { bodyRows*.$('td', 4)*.find('*')  }
    todoTabLink { $('a', href: '/categoriserHome')}
    noResultsDiv { $('#no-results-message') }
  }
}
