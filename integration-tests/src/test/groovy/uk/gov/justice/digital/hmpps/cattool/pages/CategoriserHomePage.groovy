package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class CategoriserHomePage extends Page {

  static url = '/categoriserHome'

  static at = {
    headingText == 'Prisoner Categorisation'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    dates { bodyRows*.$('td', 0)*.text() }
    names { bodyRows*.$('td', 1)*.text() }
    days { bodyRows*.$('td', 2)*.text() }
    statuses { bodyRows*.$('td', 3)*.text() }
    poms { bodyRows*.$('td', 4)*.text() }
    startButtons { bodyRows*.$('td', 5)*.find('*') }
    logoutLink { $('a', href: '/sign-out') }
    doneTabLink { $('a', href: '/categoriserDone') }
    roleSwitchSelect(required: false) { $('#roleSwitch') }
  }

  def selectFirstPrisoner() {
    startButtons[0].click() // should select Hillmob, Ant	B2345YZ 11
  }

  def selectSecondPrisoner() {
    startButtons[1].click() // should select Pitstop, Penelope	B2345XY 12
  }
}
