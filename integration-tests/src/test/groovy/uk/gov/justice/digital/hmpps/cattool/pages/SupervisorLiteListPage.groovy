package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorLiteListPage extends Page {

  static url = '/liteCategories/approveList'

  static at = {
    headingText == 'Prisoner Categorisation Approvals'
    todoTabLink.displayed
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    assessmentDates { bodyRows*.$('td', 0)*.text()  }
    names { bodyRows*.$('td', 1)*.text() }
    categorisers { bodyRows*.$('td', 2)*.text()  }
    categories { bodyRows*.$('td', 3)*.text()  }
    approveButtons { bodyRows*.$('td', 4)*.find('*')  }
    todoTabLink { $('a', href: '/supervisorHome')}
    doneTabLink { $('a', href: '/supervisorDone')}
    logoutLink { $('a', href: '/sign-out')}
  }
}
