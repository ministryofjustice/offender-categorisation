package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class RecategoriserDonePage extends Page {

  static url = '/recategoriserDone'

  static at = {
    headingText == 'Category reviews for prisoners'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    approvalDates { bodyRows*.$('td', 1)*.text()  }
    categorisers { bodyRows*.$('td', 2)*.text()  }
    approvers { bodyRows*.$('td', 3)*.text()  }
    categories { bodyRows*.$('td', 4)*.text()  }
    viewButtons { bodyRows*.$('td', 5)*.find('*')  }
    todoTabLink { $('a', href: '/recategoriserHome')}
    noResultsDiv { $('#no-results-message') }
    checkTabLink { $('a', href: '/recategoriserCheck')}
    homeTabLink { $('a', href: '/recategoriserHome')}
  }
}
