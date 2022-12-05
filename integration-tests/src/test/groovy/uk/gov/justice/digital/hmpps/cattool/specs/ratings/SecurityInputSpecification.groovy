package uk.gov.justice.digital.hmpps.cattool.specs.ratings


import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.*
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecurityInputSpecification extends AbstractSpecification {

  def "The initial cat security page can be edited"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)

    securityButton.click()

    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
    saveButton.click()

    at(new TasklistPage(bookingId: '12'))

    when: 'The edit link is selected'

    securityButton.click()

    then: 'the security input page is displayed with the saved form details'

    at(new CategoriserSecurityInputPage(bookingId: '12'))

    securityRadio == 'No'
  }

  def "A prisoner can be manually referred to security"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklist()
    at(new TasklistPage(bookingId: '12'))
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    securityButton.click()
    at(new CategoriserSecurityInputPage(bookingId: '12'))
    securityRadio = 'Yes'
    securityText << 'Some security text'
    saveButton.click()
    at(new TasklistPage(bookingId: '12'))
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Manually referred to Security ($today)")

    when: 'a security user views their homepage'
    elite2Api.stubGetStaffDetailsByUsernameList()
    fixture.logout()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Firstname_categoriser_user Lastname_categoriser_user'

    when: 'the security user enters data'
    startButtons[0].click()
    at new SecurityReviewPage(bookingId: '12')
    categoriserText == 'Some categoriser text'
    securityText << 'security info text'
    submitButton.click()

    then: 'the prisoner status is back from security'
    at SecurityHomePage
    prisonNos.size() == 0
    noOffendersText == 'There are no referrals to review.'

    when: 'the categoriser revisits the page and enters a category decision'
    fixture.logout()

    elite2Api.stubUncategorised()
    fixture.loginAs(CATEGORISER_USER)
    at CategoriserHomePage
    selectFirstPrisoner() // has been sorted to top of list!

    at new TasklistPage(bookingId: '12')
    $('#securitySection').text().contains("Completed Security ($today)")
    securityButton.click()
    at new CategoriserSecurityBackPage(bookingId: '12')

    noteFromSecurity*.text()[0] == 'Some text'
    noteFromSecurity*.text()[1] == 'security info'

    catBRadio = 'No'
    saveButton.click()

    then: 'the security rating section is complete and database is correct'
    at new TasklistPage(bookingId: '12')
    securityButton.text() == 'Edit'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ["SECURITY_BACK"]
    fixture.sameDate(LocalDate.now(), data.start_date)
    data.referred_by == ["CATEGORISER_USER"]
    fixture.sameDate(LocalDate.now(), data.referred_date)
    data.security_reviewed_by == ["SECURITY_USER"]
    fixture.sameDate(LocalDate.now(), data.security_reviewed_date)
    data.cat_type == ["INITIAL"]
    response.ratings == [securityBack: [catB: "No"], securityInput: [securityInputNeeded: "Yes", securityInputNeededText: "Some security text"]]
    response.security.review == [securityReview: "security info text"]

    when: 'the categoriser reviews the security page'
    securityButton.click()
    at new CategoriserSecurityBackPage(bookingId: '12')

    then: 'the category decision is shown'
    catBRadio == 'No'
  }
}
