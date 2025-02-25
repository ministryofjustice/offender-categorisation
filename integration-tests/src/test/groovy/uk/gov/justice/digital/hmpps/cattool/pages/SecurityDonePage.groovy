package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityDonePage extends Page {

  static url = '/securityDone'

  static at = {
    headingText == 'Prisoner Categorisation'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    reviewedDates { bodyRows*.$('td', 1)*.text()  }
    reviewer { bodyRows*.$('td', 2)*.text()  }
    catTypes { bodyRows*.$('td', 3)*.text()  }
    logoutLink { $('a', href: '/sign-out')}
    homeTabLink { $('a', href: '/securityHome')}
    viewButtons { bodyRows*.$('td', 4)*.find('*')  }
  }
}
