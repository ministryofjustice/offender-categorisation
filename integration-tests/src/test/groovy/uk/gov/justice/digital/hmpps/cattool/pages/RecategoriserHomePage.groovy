package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class RecategoriserHomePage extends Page {

  static url = '/recategoriserHome'

  static at = {
    headingText == 'Prisoner re-categorisation'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    prisonNos { bodyRows*.$('td', 1)*.text()  }
    dates { bodyRows*.$('td', 2)*.text()  }
    reasons { bodyRows*.$('td', 3)*.text()  }
    statuses { bodyRows*.$('td', 4)*.text()  }
    startButtons { bodyRows*.$('td', 5)*.find('*')  }
    logoutLink { $('a', href: '/logout')}
    // doneTabLink { $('a', href: '/categoriserDone')}
  }

  def logout() {
    logoutLink.click()
  }

  def selectFirstPrisoner() {
    startButtons[0].click() // should select 12 / B2345XY
  }

  def selectSecondPrisoner() {
    startButtons[1].click() // should select 11 / B2345YZ
  }
}
