package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserPotentialReviewsPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class PotentialReviewsSpecification extends AbstractSpecification {

  def "The Potential reviews page is displayed correctly when no results"() {
    when: 'I go to the Potential review page (without any results)'
    db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL')
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    checkTabLink.click()

    then: 'The recategoriser Potential reviews page is displayed'
    at RecategoriserPotentialReviewsPage

    doneTabLink.isDisplayed()
    todoTabLink.isDisplayed()

    noResultsText.text() == 'No risk changes found.'

  }

  def "The Potential reviews page is displayed correctly when risk changes are present"() {
    when: 'I go to the Potential review page (without any results)'
    db.createDataWithStatusAndCatType(12, 'APPROVED', JsonOutput.toJson([
      ratings: TestFixture.defaultRatingsC]), 'INITIAL')
    def raisedDate = LocalDate.of(2019, 1, 31)
    db.createRiskChange(-1, 'B2345XY', null, 'NEW',
      JsonOutput.toJson([socProfile: [transferToSecurity: true]]),
      JsonOutput.toJson([socProfile: [transferToSecurity: true]]),
      'LEI',
      raisedDate)

    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage

    elite2Api.stubGetOffenderDetailsByOffenderNoList(['B2345XY'])
    elite2Api.stubGetLatestCategorisationForOffenders()

    then: 'Potential reviews link indicates that there is 1 potential review'
    checkTabLink.text() == 'Potential reviews\n1'

    when: 'Potential review link is clicked'
    checkTabLink.click()

    then: 'The recategoriser Potential reviews page is displayed with the risk change summary'
    at RecategoriserPotentialReviewsPage

    raisedDates == ['31/01/2019']
    names == ['Clark, Frank\nB2345XY']
    dueDate == ['25/07/2019']

  }
}
