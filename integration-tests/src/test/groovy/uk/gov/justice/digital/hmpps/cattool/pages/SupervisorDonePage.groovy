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
    prisonNos { bodyRows*.$('td', 1)*.text()  }
    approvalDates { bodyRows*.$('td', 2)*.text()  }
    categorisers { bodyRows*.$('td', 3)*.text()  }
    approvers { bodyRows*.$('td', 4)*.text()  }
    outcomes { bodyRows*.$('td', 5)*.text()  }
    viewButtons { bodyRows*.$('td', 6)*.find('*')  }
    logoutLink { $('a', href: '/logout')}
  }
}
