package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class RecategoriserPotentialReviewsPage extends Page {

  static url = '/recategoriserDone'

  static at = {
    headingText == 'Category reviews for prisoners'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    raisedDates { bodyRows*.$('td', 0)*.text()  }
    names { bodyRows*.$('td', 1)*.text() }
    prisonNos { bodyRows*.$('td', 2)*.text()  }
    dueDate { bodyRows*.$('td', 3)*.text()  }
    checkButtons { bodyRows*.$('td', 4)*.find('*')  }
    todoTabLink { $('a', href: '/recategoriserHome')}
    noResultsDiv { $('#no-results-message') }
    doneTabLink { $('a', href: '/recategoriserDone')}
    noResultsText {$('#noResultsMessage')}
  }
}
