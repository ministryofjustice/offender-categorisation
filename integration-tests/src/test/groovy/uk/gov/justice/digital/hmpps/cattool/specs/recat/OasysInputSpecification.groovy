package uk.gov.justice.digital.hmpps.cattool.specs.recat

import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.OasysInputPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

class OasysInputSpecification extends AbstractSpecification{


  def "Oasys journey happy path should store data properly"() {
    when: 'I go to the Offender Assessment System (OASys) page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    oasysInputButton.click()

    then: 'The Oasys page is displayed'
    at OasysInputPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved and accessed'
    reviewDate << '17/6/2020'
    oasysRelevantInfoNo.click()
    submitButton.click()
    at TasklistRecatPage
    oasysInputButton.click()
    at OasysInputPage

    then: "data is correctly retrieved"
    reviewDate == '17/6/2020'
    form.oasysRelevantInfo == "No"

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [oasysInput: [date: "17/6/2020", oasysRelevantInfo: "No"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def "Oasys journey happy path when edit and change, add select yes should store data properly"() {
    when: 'I go to the Offender Assessment System (OASys) page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    oasysInputButton.click()

    then: 'The Oasys page is displayed'
    at OasysInputPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved'
    reviewDate << '17/6/2020'
    oasysRelevantInfoNo.click()
    submitButton.click()

    then: "data is correctly retrieved"
    at TasklistRecatPage
    oasysInputButton.click()
    at OasysInputPage
    reviewDate == '17/6/2020'
    form.oasysRelevantInfo == "No"

    when: "Data is edited"
    oasysRelevantInfoYes.click()
    oasysInputText << 'test'

    submitButton.click()

    then: 'Edited data stored properly'
    at TasklistRecatPage
    oasysInputButton.click()
    at OasysInputPage
    reviewDate == '17/6/2020'
    form.oasysRelevantInfo == "Yes"

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [oasysInput: [date: "17/6/2020",oasysInputText: "test", oasysRelevantInfo: "Yes"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def "Oasys journey check validation errors when date is not real and no yes or no selected"() {
    when: 'I go to the Offender Assessment System (OASys) page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    oasysInputButton.click()

    then: 'The Oasys page is displayed'
    at OasysInputPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'no date is entered and Yes or No is not clicked'
    reviewDate << ''
    submitButton.click()

    then: "error messages should be displayed"
    then: 'I stay on the page with validation errors'

    at OasysInputPage
    errorSummaries[0].text() == 'Completion date of the latest full review must be a real date'
    errorSummaries[1].text() == 'Select yes if there was any information in the review that is relevant to the recategorisation'
  }
}
