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
    prisonNos { bodyRows*.$('td', 2)*.text()  }
    categorisers { bodyRows*.$('td', 3)*.text()  }
    categories { bodyRows*.$('td', 4)*.text()  }
    approveButtons { bodyRows*.$('td', 5)*.find('*')  }
    todoTabLink { $('a', href: '/supervisorHome')}
    doneTabLink { $('a', href: '/supervisorDone')}
    logoutLink { $('a', href: '/sign-out')}
  }
}
