package uk.gov.justice.digital.hmpps.cattool.specs.recat

import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.responsetemplating.ResponseTemplateTransformer
import geb.spock.GebReportingSpec
import groovy.json.JsonOutput
import org.junit.Rule
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.model.DatabaseUtils
import uk.gov.justice.digital.hmpps.cattool.model.TestFixture
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserDonePage

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER

class RecategoriserDoneSpecification extends GebReportingSpec {

  static final TODAY = LocalDate.now()

  def setup() {
    db.clearDb()
  }

  @Rule
  Elite2Api elite2Api = new Elite2Api()

  @Rule
  RiskProfilerApi riskProfilerApi = new RiskProfilerApi()

  @Rule
  OauthApi oauthApi = new OauthApi(new WireMockConfiguration()
    .extensions(new ResponseTemplateTransformer(false)))

  TestFixture fixture = new TestFixture(browser, elite2Api, oauthApi, riskProfilerApi)
  DatabaseUtils db = new DatabaseUtils()

  def "The done page for a recategoriser is present"() {
    when: 'I go to the home page as recategoriser'
    db.createDataWithIdAndStatusAndCatType(-1, 12, 'APPROVED', JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'RECAT')

    db.createDataWithIdAndStatusAndCatType(-2,11, 'APPROVED', JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'INITIAL')

    db.createApprovedCategorisationWithSeqAndApprovalDate(-3,10, JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'RECAT', 1, TODAY)

    db.createApprovedCategorisationWithSeqAndApprovalDate(-4,10, JsonOutput.toJson([
       recat: fixture.defaultRecat]), 'RECAT', 2, TODAY.minusDays(1).toString())

    db.createNomisSeqNo(10, 7, 2)
    db.createNomisSeqNo(10, 5, 1)
    db.createNomisSeqNo(12, 8)

    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubCategorisedMultiple([12,10])
    elite2Api.stubGetStaffDetailsByUsernameList()
    checkTabLink.isDisplayed()
    doneTabLink.click()

    then: 'The recategoriser done page is displayed, showing only approved recats'
    at RecategoriserDonePage

    prisonNos == ['B2345XY','B1234AB','B1234AB']
    names == ['Scramble, Tim','Perfect, Peter','Perfect, Peter']
    approvalDates == ['20/04/2019','20/03/2019','19/01/2019']
    categorisers == ['Lamb, John','Dastardly, Dick','Table, Simon']
    approvers == ['Lastname_supervisor_user, Firstname_supervisor_user', 'Lastname_supervisor_user, Firstname_supervisor_user', 'Lastname_supervisor_user, Firstname_supervisor_user']
    categories == ['C','B','B']
  }

  def "The done page does not display offenders that haven't been categorised through the Categorisation tool"() {
    when: 'I go to the home page as recategoriser'

    elite2Api.stubRecategorise()
    fixture.loginAs(RECATEGORISER_USER)
    at RecategoriserHomePage
    elite2Api.stubCategorised([])
    doneTabLink.click()

    then: 'The categoriser done page is displayed without the "PNOMIS" categorised offenders'
    at RecategoriserDonePage
    prisonNos == []
    noResultsDiv.isDisplayed()
  }
}
