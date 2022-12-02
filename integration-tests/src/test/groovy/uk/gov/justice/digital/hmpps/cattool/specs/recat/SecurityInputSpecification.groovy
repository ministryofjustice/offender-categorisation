package uk.gov.justice.digital.hmpps.cattool.specs.recat


import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.SecurityReviewPage
import uk.gov.justice.digital.hmpps.cattool.pages.TasklistRecatPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.SecurityBackPage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.SecurityInputPage
import uk.gov.justice.digital.hmpps.cattool.specs.AbstractSpecification

import java.time.LocalDate

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.SECURITY_USER

class SecurityInputSpecification extends AbstractSpecification {

  def "The recat security page can be edited"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)

    securityButton.click()

    at(new SecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
    saveButton.click()

    at TasklistRecatPage

    when: 'The edit link is selected'
    securityButton.click()

    then: 'the security input page is displayed with the saved form details'
    at(new SecurityInputPage(bookingId: '12'))

    securityRadio == 'No'
  }

  def "Can be referred to security after supervisor rejection"() {
    given: 'the supervisor set back the categorisation'
    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    db.updateStatus(12, 'SUPERVISOR_BACK')

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)

    when: 'The user refers to security'
    securityButton.click()

    at(new SecurityInputPage(bookingId: '12'))
    securityRadio = 'Yes'
    securityText << 'some security text'
    saveButton.click()

    then: 'The task is displayed with the correct manually referred information'
    at TasklistRecatPage
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Manually referred to Security ($today)")
  }

  def "A prisoner can be manually referred to security"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklistRecat()
    at TasklistRecatPage
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    securityButton.click()
    at(new SecurityInputPage(bookingId: '12'))
    securityRadio = 'Yes'
    securityText << 'some security text'
    saveButton.click()
    at TasklistRecatPage
    securityButton.tag() == 'button'
    securityButton.@disabled
    def today = LocalDate.now().format('dd/MM/yyyy')
    $('#securitySection').text().contains("Manually referred to Security ($today)")

    when: 'a security user views their homepage'
    elite2Api.stubGetStaffDetailsByUsernameList()
    fixture.logout()
    elite2Api.stubGetOffenderDetailsByOffenderNoList(12, 'B2345YZ')
    elite2Api.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    elite2Api.stubGetLatestCategorisationForOffenders()
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Firstname_recategoriser_user Lastname_recategoriser_user'
    days[0] == '' // sentence irrelevant
    dates[0] == '25/07/2019' // nextReviewDate
    catTypes[0] == 'Recat'

    when: 'the security user enters data'
    startButtons[0].click()
    at new SecurityReviewPage(bookingId: '12')
    categoriserText == 'some categoriser text'
    securityText << 'security info text'
    submitButton.click()

    then: 'the prisoner status is back from security'
    at SecurityHomePage
    prisonNos.size() == 0
    noOffendersText == 'There are no referrals to review.'

    when: 'the categoriser revisits the page and enters a category decision'
    fixture.logout()
    fixture.gotoTasklistRecat()
    at TasklistRecatPage
    $('#securitySection').text().contains("Completed Security ($today)")
    securityButton.click()
    at new SecurityBackPage(bookingId: '12')
    warning.text() contains 'This person was referred to the security team'
    noteFromSecurity.text() == 'security info text'
    saveButton.click()

    then: 'the security recat section is complete and database is correct'
    at TasklistRecatPage
    securityButton.text() == 'Edit'

    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ["SECURITY_BACK"]
    fixture.sameDate(LocalDate.now(), data.start_date)
    data.referred_by == ["RECATEGORISER_USER"]
    fixture.sameDate(LocalDate.now(), data.referred_date)
    data.security_reviewed_by == ["SECURITY_USER"]
    fixture.sameDate(LocalDate.now(), data.security_reviewed_date)
    data.cat_type == ["RECAT"]
    response.recat == [securityBack: [:], securityInput: [securityInputNeeded: "Yes", securityInputNeededText: "some security text"]]
    response.security.review == [securityReview: "security info text"]
  }
}
