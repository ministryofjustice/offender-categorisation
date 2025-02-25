package uk.gov.justice.digital.hmpps.cattool.pages

import geb.Page

class SupervisorHomePage extends Page {

  static url = '/supervisorHome'

  static at = {
    headingText == 'Prisoner Categorisation Approvals'
  }

  static content = {
    headingText { $('h1').text() }
    bodyRows(required: false) { $('tr.govuk-table__row', 1..-1) }
    names { bodyRows*.$('td', 0)*.text() }
    days { bodyRows*.$('td', 1)*.text()  }
    dates { bodyRows*.$('td', 2)*.text()  }
    nextReviewDate { bodyRows*.$('td', 3)*.text()  }
    catBy { bodyRows*.$('td', 4)*.text()  }
    statuses { bodyRows*.$('td', 5)*.text()  }
    catTypes { bodyRows*.$('td', 6)*.text()  }
    startButtons { bodyRows*.$('td', 7)*.find('*')  }
    startButton{$('#offenderTable > tbody > tr > td:nth-child(8) > a') }
    logoutLink { $('a', href: '/sign-out')}
    doneTabLink { $('a', href: '/supervisorDone')}
    liteCategoriesTab { $('a', href: '/liteCategories/approveList') }
    multipleRoleDiv(required: false) { $('#multiple-role') }
    roleSwitchSelect(required: false) { $('#roleSwitch') }
  }
}
