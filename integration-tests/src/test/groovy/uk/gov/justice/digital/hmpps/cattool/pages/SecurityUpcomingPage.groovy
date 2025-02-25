package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityUpcomingPage extends Page {

  static url = '/securityUpcoming'

  static at = {
    headingText == 'Categorisation referrals'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    dueDates { bodyRows*.$('td', 2)*.text()  }
    referrer { bodyRows*.$('td', 3)*.text()  }
    logoutLink { $('a', href: '/sign-out')}
    homeTabLink { $('a', href: '/securityHome')}
  }
}
