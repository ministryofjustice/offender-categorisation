package uk.gov.justice.digital.hmpps.cattool.specs.ratings

import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.OpenConditionsAddedPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistPage
import uk.gov.justice.digital.hmpps.cattool.pages.ratings.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_USER

class DecisionSpecification extends AbstractSpecification {

  def "The Decision page is shown correctly"() {
    given: 'A female categoriser is logged in'
    elite2Api.stubUncategorisedNoStatus(700, 'PFI')
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [TODAY.plusDays(-3).toString()])
    fixture.loginAs(FEMALE_USER)

    at CategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, "ON700")
    riskProfilerApi.stubForTasklists('ON700', 'U(Unsentenced)', false)
    selectFirstPrisoner()

    when: 'I go to the decision page'
    at(new TasklistPage(bookingId: '700'))
    decisionButton.click()

    then: 'a decision page is displayed'
    at DecisionPage

    when: 'An empty form is submitted'
    submitButton.click()

    then: 'There is a validation error'
    errorSummaries*.text() == ['Select the category that is most suitable for this person']
    errors.text().toString() == "Error:\nSelect the category that is most suitable for this person"

    when: 'Open option is submitted'
    openOption.click()
    submitButton.click()

    then: "Open conditions added page is displayed"
    at OpenConditionsAddedPage
    button.click()
    at TasklistPage

    and: "data is correct"
    def dataAfterOpen = db.getData(700)
    def responseAfterOpen = new JsonSlurper().parseText(dataAfterOpen.form_response[0].toString())
    dataAfterOpen.status == ['STARTED']
    dataAfterOpen.cat_type == ['INITIAL']
    dataAfterOpen.user_id == ['FEMALE_USER']
    dataAfterOpen.assigned_user_id == ['FEMALE_USER']
    responseAfterOpen.ratings == [decision: [category: "T"]]
    responseAfterOpen.openConditionsRequested == true

    when: "On tasklist page"
    at(new TasklistPage(bookingId: '700'))
    decisionButton.click()

    then: 'a decision page is displayed'
    at DecisionPage

    when: 'Closed option is submitted'
    closedOption.click()
    submitButton.click()

    then: "Tasklist is displayed"
    at TasklistPage

    and: "data is correct"
    def dataAfterClosed = db.getData(700)
    def responseAfterClosed = new JsonSlurper().parseText(dataAfterClosed.form_response[0].toString())
    responseAfterClosed.ratings == [decision: [category: "R"]]
    responseAfterClosed.openConditionsRequested == false
  }
}
