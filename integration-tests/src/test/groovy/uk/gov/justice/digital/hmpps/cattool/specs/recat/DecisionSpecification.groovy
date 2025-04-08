package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.OpenConditionsAddedPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.DecisionPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.HigherSecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.MiniHigherSecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_RECAT_USER

class DecisionSpecification extends AbstractSpecification {

  def "The page saves details correctly"() {
    when: 'I go to the Decision page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    decisionButton.click()

    then: 'The page is displayed'
    at DecisionPage
    headerValue*.text() == fixture.MINI_HEADER
    hints*.text() == [
      'You will need to complete a higher security review for this person, after choosing this category.',
      'Choosing this category requires no additional reviews or assessments.',
      'You will need to complete an open conditions assessment for this person, to check they are suitable for Category D conditions.']

    when: 'Details are entered, saved and accessed'
    categoryCOption.click()

    submitButton.click()
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage

    then: "data is correctly retrieved"
    form.category == "C"

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [decision: [category: "C"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']
  }

  def "Indeterminate offender displays warning"() {

    when: 'I go to the decision page'
    fixture.gotoTasklistRecatForCatIIndeterminate(false)
    at TasklistRecatPage
    decisionButton.click()

    then: 'The page is displayed without open condition options'
    at DecisionPage
    headerValue[1].text() == 'C0001AA'
    indeterminateWarning.displayed
  }

  def "The correct mini higher security page is displayed for I->B"() {
    when: 'I go to the Mini Higher Security Review page'
    fixture.gotoTasklistRecatForCatI(false)
    at TasklistRecatPage
    decisionButton.click()

    then: 'The page is displayed'
    at DecisionPage
    headerValue[1].text() == 'C0001AA'
    hints*.text() == [
      'You will need to complete a higher security review for this person, after choosing this category.',
      'Choosing this category requires no additional reviews or assessments.',
      'You will need to complete an open conditions assessment for this person, to check they are suitable for Category D conditions.',
      'Choosing this category requires no additional reviews or assessments.',
      'You will need to complete an open conditions assessment for this person, to check they are suitable for YOI open conditions.']

    when: 'Details are entered, saved and accessed'
    categoryBOption.click()

    submitButton.click()
    at MiniHigherSecurityReviewPage
    conditions << 'mini higher security text'
    submitButton.click()
    at TasklistRecatPage

    then: "data is correctly retrieved"
    decisionButton.click()
    at DecisionPage
    form.category == "B"

    def data = db.getData(21)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [decision: [category: "B"], miniHigherSecurityReview: [conditions: 'mini higher security text']]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']

    when: 'user changes their mind - mini higher security data is cleared'
    categoryDOption.click()
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()
    at TasklistRecatPage

    then: "data no longer includes higher security data"

    def dataAfterClear = db.getData(21)
    def responseAfterClear = new JsonSlurper().parseText(dataAfterClear.form_response[0].toString())
    dataAfterClear.status == ['STARTED']
    dataAfterClear.cat_type == ['RECAT']
    responseAfterClear.recat == [decision: [category: "D"]]
    dataAfterClear.user_id == ['RECATEGORISER_USER']
    dataAfterClear.assigned_user_id == ['RECATEGORISER_USER']
  }

  def "The correct higher security page is displayed for C->B"() {
    when: 'I go to the Decision page'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    decisionButton.click()

    then: 'The page is displayed'
    at DecisionPage
    headerValue*.text() == fixture.MINI_HEADER

    when: 'Details are entered, saved and accessed'
    categoryBOption.click()

    submitButton.click()
    at HigherSecurityReviewPage
    behaviour << "Some behaviour text"
    steps << "Some steps text"
    transferNo.click()
    transferText << "Some transfer text"
    conditions << "Some conditions text"
    submitButton.click()
    at TasklistRecatPage

    then: "data is correctly retrieved"
    decisionButton.click()
    at DecisionPage
    form.category == "B"

    when: "Higher security is accessed again"
    submitButton.click()

    then: "data is correctly retrieved"
    at HigherSecurityReviewPage
    behaviour == "Some behaviour text"
    steps == "Some steps text"
    form.transfer == "No"
    transferText == "Some transfer text"
    conditions == "Some conditions text"

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ['STARTED']
    data.cat_type == ['RECAT']
    response.recat == [
      decision            : [category: "B"],
      higherSecurityReview: [steps       : "Some steps text",
                             behaviour   : "Some behaviour text",
                             conditions  : "Some conditions text",
                             transfer    : "No",
                             transferText: "Some transfer text"]]
    data.user_id == ['RECATEGORISER_USER']
    data.assigned_user_id == ['RECATEGORISER_USER']

    when: 'user changes their mind - higher security data is cleared'
    submitButton.click()
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryDOption.click()
    submitButton.click()
    at OpenConditionsAddedPage
    button.click()
    at TasklistRecatPage

    then: "data no longer includes higher security data"

    def dataAfterClear = db.getData(12)
    def responseAfterClear = new JsonSlurper().parseText(dataAfterClear.form_response[0].toString())
    dataAfterClear.status == ['STARTED']
    dataAfterClear.cat_type == ['RECAT']
    responseAfterClear.recat == [decision: [category: "D"]]
    dataAfterClear.user_id == ['RECATEGORISER_USER']
    dataAfterClear.assigned_user_id == ['RECATEGORISER_USER']
  }

  def 'Validation test'() {
    when: 'I submit the page with empty details'
    fixture.gotoTasklistRecat(false)
    at TasklistRecatPage
    decisionButton.click()
    to DecisionPage, '12'

    at DecisionPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    at DecisionPage
    errorSummaries*.text() == ['Select what category is most suitable for this person']
    errors.text().toString() == "Error:\nSelect the category that is most suitable for this person"
  }

  def "the category decision page for women YOI"() {
    given: 'I go to category decision page for women YO'
    elite2Api.stubRecategoriseWomen()
    prisonerSearchApi.stubGetPrisonerSearchPrisonersWomen()
    prisonerSearchApi.stubSentenceData(['ON700', 'ON701'], [700, 701], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(FEMALE_RECAT_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomenYOI(21, 'C0001AA', true, 'YOI Closed')
    riskProfilerApi.stubForTasklists('C0001AA', 'YOI Closed', false)
    browser.selectSecondPrisoner()
    at TasklistRecatPage
    decisionButton.click()

    when: 'I dont select anything'
    at DecisionPage
    submitButton.click()

    then: 'I stay on the page with validation errors'
    waitFor { at DecisionPage }
    waitFor {
      errorSummaries*.text() == ['Select what category is most suitable for this person']
    }
    waitFor {
      errors.text().toString() == "Error:\nSelect the category that is most suitable for this person"
    }

    when: 'YOI Open option is submitted'
    categoryJOption.click()
    submitButton.click()

    then: "Open conditions added page is displayed"
    at OpenConditionsAddedPage
    button.click()

    when: 'I select yoi closed option'
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryIOption.click()
    submitButton.click()

    then: 'recat task list page is displayed'
    at TasklistRecatPage

  }

  def "Validate open and close option on  recat category decision page for YOI"(){
    given: 'I go to decision page for YOI'
    elite2Api.stubRecategoriseWomen()
    prisonerSearchApi.stubGetPrisonerSearchPrisonersWomen()
    prisonerSearchApi.stubSentenceData(['ON700', 'ON701'], [700, 701], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(FEMALE_RECAT_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomenYOI(21, 'C0001AA', true, 'YOI Closed')
    riskProfilerApi.stubForTasklists('C0001AA', 'YOI Closed', false)
    browser.selectSecondPrisoner()
    at TasklistRecatPage
    decisionButton.click()

    when: 'Open option is submitted'
    at DecisionPage
    categoryTOption.click()
    submitButton.click()

    then: "Open conditions added page is displayed"
    at OpenConditionsAddedPage
    button.click()

    when: 'I select closed option'
    at TasklistRecatPage
    decisionButton.click()
    at DecisionPage
    categoryROption.click()
    submitButton.click()

    then: 'recat task list page is displayed'
    at TasklistRecatPage

  }

}
