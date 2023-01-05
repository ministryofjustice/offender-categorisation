package uk.gov.justice.digital.hmpps.cattool.specs


import uk.gov.justice.digital.hmpps.cattool.pages.ErrorPage
import uk.gov.justice.digital.hmpps.cattool.pages.SupervisorHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SUPERVISOR_USER

class ErrorSpecification extends AbstractSpecification {

  def "The error page is displayed when an unexpected error occurs"() {
    when: 'A 500 error occurs in an API call'
    elite2Api.stubUncategorisedAwaitingApproval()
    prisonerSearchApi.stubSentenceDataError()
    fixture.loginAs(SUPERVISOR_USER)

    then: 'the error page is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'A test error'
    errorText.text() == 'status 500'
  }

  def "The auth page is displayed when a user does not have the correct role for the url"() {
    when: 'The user hits a page not for their role'
    elite2Api.stubUncategorisedAwaitingApproval()
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])
    fixture.loginAs(SUPERVISOR_USER)
    go 'tasklist/12'

    then: 'the auth error page is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'Unauthorised access: required role not present'
    errorText.text() == 'status 403'

    when: 'The user hits a nonexistent page'
    to SupervisorHomePage
    go 'idontexist/12'

    then: 'the auth error page is displayed'
    at ErrorPage
    errorSummaryTitle.text() == 'Url not recognised'
    errorText.text() == 'status 403'
  }
}
