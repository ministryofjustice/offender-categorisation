package uk.gov.justice.digital.hmpps.cattool.specs.recat

import groovy.json.JsonOutput
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

  def "The recat security page cannot be edited and data are saved"() {
    given: 'The recategoriser clicks security in task list'

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', false)
    securityButton.click()

    when: 'I submit a blank page'
    at(new SecurityInputPage(bookingId: '12'))
    saveButton.click()

    then: 'there is a validation error'
    waitFor {
      errorSummaries*.text() == ['Select yes if you want to include a note to security']
      errors*.text() == ['Error:\nSelect yes if you want to include a note to security']
    }

    when: 'No note is selected on the security page'
    securityRadio = 'No'
    saveButton.click()

    then: 'The task is displayed with the correct manually referred information'
    at TasklistRecatPage
    securityButton.@disabled

    and: 'correct data are saved'
    def data = db.getData(12)
    def response = new JsonSlurper().parseText(data.form_response[0].toString())
    data.status == ["SECURITY_MANUAL"]
    fixture.sameDate(LocalDate.now(), data.start_date)
    data.referred_by == ["RECATEGORISER_USER"]
    fixture.sameDate(LocalDate.now(), data.referred_date)
    data.cat_type == ["RECAT"]

    and: 'securityInputNeeded will be true'
    response.recat == [securityInput: [securityInputNeeded: "Yes", securityNoteNeeded: "No"]]
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

  def "A note can be added for security"() {
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
    prisonerSearchApi.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
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
    securityText << ''
    headerRecatNote.displayed
    pRecatNote.displayed
    recatWarning.displayed
    submitButton.click()

    then: "error messages should be displayed"
    and: 'I stay on the page with validation errors'

    at SecurityReviewPage
    errorSummaries[0].text() == 'Enter security information'
    errors[0].text().contains('Enter security information')

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

    noteFromSecurity*.text()[0] == 'Some text'
    noteFromSecurity*.text()[1] == 'security info'

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

    response.recat == [securityBack: [:], securityInput: [securityInputNeeded: "Yes", securityNoteNeeded: "Yes", securityInputNeededText: "some security text"]]
    response.security.review == [securityReview: "security info text"]

  }

  def "A note was not added text is visible " () {
    given: 'The recategoriser selected no note needed'
    db.createDataWithIdAndStatusAndCatType(-1, 12, 'SECURITY_BACK', JsonOutput.toJson([
      recat: fixture.defaultRecat]), 'RECAT')

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    when: 'No note is selected on the security page'
    securityButton.click()

    then: 'The task is displayed with the correct manually referred information'
    at new SecurityBackPage(bookingId: '12')
    noteFromSecurity*.text()[0] == 'A note was not added'
  }

  def "A note is not visible if auto/flagged" () {
    given: 'The recategoriser selected no note needed'
    db.createDataWithIdAndStatusAndCatType(-1, 12, 'SECURITY_BACK', JsonOutput.toJson([
      decision          : [category: "C"],
      oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
      nextReviewDate    : [date: "14/12/2019"],
      prisonerBackground: [offenceDetails: "offence Details text"],
      riskAssessment    : [
        lowerCategory    : "lower security category text",
        otherRelevant    : "Yes",
        higherCategory   : "higher security category text",
        otherRelevantText: "other relevant information"
      ]
    ]), 'RECAT')

    fixture.gotoTasklistRecat()
    at TasklistRecatPage

    when: 'No note is selected on the security page'
    securityButton.click()

    then: 'The task is displayed with the correct manually referred information'
    at new SecurityBackPage(bookingId: '12')
    noteFromSecurity*.text()[0] != 'A note was not added'
  }

  def "A note is not added for security"() {
    given: 'the security input page has been completed'

    fixture.gotoTasklistRecat()
    at TasklistRecatPage
    elite2Api.stubAssessments(['B2345YZ'])
    elite2Api.stubSentenceDataGetSingle('B2345YZ', '2014-11-23')
    securityButton.click()
    at(new SecurityInputPage(bookingId: '12'))
    securityRadio = 'No'
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
    prisonerSearchApi.stubSentenceData(['B2345YZ'], [12], ['2019-01-28'])
    elite2Api.stubGetLatestCategorisationForOffenders()
    fixture.loginAs(SECURITY_USER)

    then: 'this prisoner is present'
    at SecurityHomePage
    prisonNos[0] == 'B2345YZ'
    referredBy[0] == 'Firstname_recategoriser_user Lastname_recategoriser_user'
    days[0] == '' // sentence irrelevant
    dates[0] == '25/07/2019' // nextReviewDate
    catTypes[0] == 'Recat'

    when: 'the security user reads the page'
    startButtons[0].click()
    then: 'No note added text is displayed'
    at new SecurityReviewPage(bookingId: '12')
    pRecatNoNote.displayed
  }
}
