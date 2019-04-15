package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SecurityHomePage extends Page {

  static url = '/securityHome'

  static at = {
    headingText == 'Categorisation referrals'
  }

  static content = {
    headingText { $('h1.govuk-heading-l').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    prisonNos { bodyRows*.$('td', 1)*.text()  }
    days { bodyRows*.$('td', 2)*.text()  }
    dates { bodyRows*.$('td', 3)*.text()  }
    referredBy { bodyRows*.$('td', 4)*.text()  }
    startButtons { bodyRows*.$('td', 5)*.find('*')  }
    logoutLink { $('a', href: '/logout')}
    noOffendersText { $('h3.govuk-heading-s').text() }
    logoutLink { $('a', href: '/logout')}
    doneTabLink { $('a', href: '/securityDone')}
  }

  def logout() {
    logoutLink.click()
  }
}
