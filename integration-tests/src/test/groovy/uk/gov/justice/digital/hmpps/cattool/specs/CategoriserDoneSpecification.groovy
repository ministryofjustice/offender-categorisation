package uk.gov.justice.digital.hmpps.cattool.specs


import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserDonePage
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER

class CategoriserDoneSpecification extends AbstractSpecification {

  def "The done page for a categoriser is present"() {
    when: 'I go to the home page as categoriser'
    db.createDataWithIdAndStatusAndCatType(-1,12, 'APPROVED', JsonOutput.toJson([
      ratings: fixture.defaultRatingsC ]), 'INITIAL')

    db.createDataWithIdAndStatusAndCatType(-2,11, 'APPROVED', JsonOutput.toJson([
      ratings: fixture.defaultRatingsC ]), 'INITIAL')

    db.createDataWithIdAndStatusAndCatType(-3,10, 'APPROVED', JsonOutput.toJson([
      ratings: fixture.defaultRatingsC ]), 'RECAT')

    db.createNomisSeqNo(11, 7)
    db.createNomisSeqNo(12, 8)

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(CATEGORISER_USER)


    at CategoriserHomePage

    elite2Api.stubCategorisedMultiple()
    elite2Api.stubGetStaffDetailsByUsernameList()
    doneTabLink.click()

    then: 'The categoriser done page is displayed, showing only approved initial cats'

    at CategoriserDonePage

    prisonNos == ['B2345XY', 'B2345YZ']
    names == ['Scramble, Tim', 'Hemmel, Sarah']

    approvalDates == ['20/04/2019', '28/02/2019']
    categorisers == ['Lamb, John', 'Fan, Jane']
    approvers == ['Lastname_supervisor_user, Firstname_supervisor_user', 'Lastname_supervisor_user, Firstname_supervisor_user']
  }

  def "The done page does not display offenders that haven't been categorised through the Categorisation tool"() {
    when: 'I go to the home page as categoriser'

    elite2Api.stubUncategorised()
    elite2Api.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [LocalDate.now().toString(), LocalDate.now().toString()])

    fixture.loginAs(CATEGORISER_USER)

    at CategoriserHomePage

    elite2Api.stubCategorised([])

    doneTabLink.click()

    then: 'The categoriser done page is displayed without the "PNOMIS" categorised offenders'

    at CategoriserDonePage

    prisonNos == []
    noResultsDiv.isDisplayed()

  }

}
