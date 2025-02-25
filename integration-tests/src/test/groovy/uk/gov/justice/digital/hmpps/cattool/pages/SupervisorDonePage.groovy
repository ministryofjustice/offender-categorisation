package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorDonePage extends Page {

  static url = '/supervisorDone'

  static at = {
    headingText == 'Prisoner Categorisation Approvals'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    approvalDates { bodyRows*.$('td', 1)*.text()  }
    categorisers { bodyRows*.$('td', 2)*.text()  }
    approvers { bodyRows*.$('td', 3)*.text()  }
    outcomes { bodyRows*.$('td', 4)*.text()  }
    catTypes { bodyRows*.$('td', 5)*.text()  }
    viewButtons { bodyRows*.$('td', 6)*.find('*')  }
    liteCategoriesTab { $('a', href: '/liteCategories/approveList') }
    logoutLink { $('a', href: '/sign-out')}
  }
}
