package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.CategoryHistoryPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.PrisonerBackgroundPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class PrisonerBackgroundSpecification extends AbstractSpecification {

  def "The page displays all warnings and saves details correctly"() {
    when: 'I go to the Prisoner background page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    alertsApi.stubGetEscapeAlerts('B2345YZ', false, true)
    formApi.stubGetViperData('B2345YZ', false)
    elite2Api.stubGetAssaultIncidents('B2345YZ')

    prisonerBackgroundLink.click()

    then: 'The page is displayed'
    at PrisonerBackgroundPage
    headerValue*.text() == fixture.MINI_HEADER
    extremismWarning.text() contains 'This person is at risk of engaging in, or vulnerable to, extremism'
    violenceWarning.text() contains 'This person has been reported as involved in 5 assaults in custody. In the past 12 months, there have been 2 serious assaults and 3 non-serious assaults. You should consider the dates and context of these assaults in your assessment.'
    !violenceNotifyWarning.displayed
    escapeWarning.text().contains('This person is considered an escape risk')
    !escapeInfo.displayed
    !extremismInfo.displayed
    !escapeInfo.displayed


    when: 'Details are entered, saved and accessed'
    offenceDetails << 'offenceDetails text'
    submitButton.click()
    at TasklistRecatPage
    prisonerBackgroundLink.click()
    at PrisonerBackgroundPage

    then: "data is correctly retrieved"
    offenceDetails == 'offenceDetails text'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [prisonerBackground: [offenceDetails: 'offenceDetails text']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'The page validates correctly'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    alertsApi.stubGetEscapeAlerts('B2345YZ', true, false)
    formApi.stubGetViperData('B2345YZ', true)
    elite2Api.stubGetAssaultIncidents('B2345YZ')

    prisonerBackgroundLink.click()

    at PrisonerBackgroundPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    waitFor { at PrisonerBackgroundPage }
    waitFor {
      errorSummaries*.text() == ['Please enter details']
    }
    waitFor {
      errors.text().toString() == "Error:\nPlease enter details"
    }
  }

  def "The prisoner background page provides a link to view Offender category history"() {
    when: 'I go to the Prisoner background page and click on the category history link'

    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage

    elite2Api.stubAssessments('B2345YZ')
    elite2Api.stubAgencyDetails('LPI')
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 1)
    alertsApi.stubGetEscapeAlerts('B2345YZ', true, false)
    formApi.stubGetViperData('B2345YZ', false)
    elite2Api.stubGetAssaultIncidents('B2345YZ')

    prisonerBackgroundLink.click()
    at PrisonerBackgroundPage

    then: 'Cat history is displayed in a new tab'
    withNewWindow({ historyLink.click() }) {
      at CategoryHistoryPage
    }
  }


}
