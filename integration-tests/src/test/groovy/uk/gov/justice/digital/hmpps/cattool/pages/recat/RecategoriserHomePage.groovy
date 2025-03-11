package uk.gov.justice.digital.hmpps.cattool.pages.recat

import geb.Page

class RecategoriserHomePage extends Page {

  static url = '/recategoriserHome'

  static at = {
    headingText == 'Category reviews for prisoners'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    dates { bodyRows*.$('td', 0)*.text()  }
    names { bodyRows*.$('td', 1).collect { it.$('a').text().trim() + " " + it.$('p').text().trim() } }
    reasons { bodyRows*.$('td', 2)*.text()  }
    statuses { bodyRows*.$('td', 3)*.text()  }
    poms { bodyRows*.$('td', 4)*.text()  }
    startButtons { bodyRows*.$('td', 5)*.find('*')  }
    logoutLink { $('a', href: '/sign-out')}
    doneTabLink { $('a', href: '/recategoriserDone')}
    checkTabLink { $('a', href: '/recategoriserCheck')}
  }

  def selectFirstPrisoner() {
    waitFor {
      startButtons[0].click() // should select 11 / B2345YZ
    }
  }

  def selectSecondPrisoner() {
    waitFor {
      startButtons[1].click() // should select 12 / B2345XY
    }
  }
}
