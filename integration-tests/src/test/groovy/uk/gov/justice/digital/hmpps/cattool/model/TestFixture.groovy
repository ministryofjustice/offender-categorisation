package uk.gov.justice.digital.hmpps.cattool.model

import geb.Browser
import uk.gov.justice.digital.hmpps.cattool.mockapis.AllocationApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.cattool.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.PathfinderApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.PrisonerSearchApi
import uk.gov.justice.digital.hmpps.cattool.mockapis.RiskProfilerApi
import uk.gov.justice.digital.hmpps.cattool.pages.CategoriserHomePage
import uk.gov.justice.digital.hmpps.cattool.pages.recat.RecategoriserHomePage

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoField
import java.time.temporal.ChronoUnit

import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.CATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_RECAT_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.RECATEGORISER_USER
import static uk.gov.justice.digital.hmpps.cattool.model.UserAccount.FEMALE_USER

class TestFixture {

  Browser browser
  Elite2Api elite2Api
  RiskProfilerApi riskProfilerApi
  AllocationApi allocationApi
  PrisonerSearchApi prisonerSearchApi
  OauthApi oauthApi
  PathfinderApi pathfinderApi

  UserAccount currentUser

  public static final defaultRatingsB = [
    offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
    securityInput   : [securityInputNeeded: "No"],
    furtherCharges  : [furtherCharges: "Yes", furtherChargesText: "some charges"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "Yes"],
    escapeRating    : [escapeOtherEvidence: "Yes", escapeOtherEvidenceText: "evidence details", escapeCatB: "Yes", escapeCatBText: "cat b details"],
    extremismRating : [previousTerrorismOffences: "Yes"],
    nextReviewDate  : [date: "14/12/2019"]
  ]

  public static final defaultRatingsC = [
    offendingHistory: [previousConvictions: "Yes", previousConvictionsText: "some convictions"],
    securityInput   : [securityInputNeeded: "No"],
    furtherCharges  : [furtherCharges: "No"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
    escapeRating    : [escapeOtherEvidence: "No"],
    extremismRating : [previousTerrorismOffences: "No"],
    nextReviewDate  : [date: "14/12/2019"]
  ]

  public static final defaultRatingsClosed = [
    decision          : [category: "R"],
    offendingHistory: [previousConvictions: "No"],
    securityInput   : [securityInputNeeded: "No"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
    escapeRating    : [escapeOtherEvidence: "No"],
    extremismRating : [previousTerrorismOffences: "Yes"],
    nextReviewDate  : [date: "14/12/2019"]
  ]

  public static final defaultRatingsYOIClosed = [
    decision          : [category: "I"],
    offendingHistory: [previousConvictions: "No"],
    securityInput   : [securityInputNeeded: "No"],
    violenceRating  : [highRiskOfViolence: "No", seriousThreat: "No"],
    escapeRating    : [escapeOtherEvidence: "No"],
    extremismRating : [previousTerrorismOffences: "Yes"],
    nextReviewDate  : [date: "14/12/2019"]
  ]

  public static final defaultRecatClosed = [
    decision          : [category: "R"],
    oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
    securityInput     : [securityInputNeeded: "Yes", securityNoteNeeded: "No"],
    nextReviewDate    : [date: "14/12/2019"],
    prisonerBackground: [offenceDetails: "offence Details text"],
    riskAssessment    : [
      lowerCategory    : "lower category text",
      otherRelevant    : "No",
      higherCategory   : "higher category text",
    ]
  ]

  public static final defaultRecatYOIClosed = [
    decision          : [category: "I"],
    oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
    securityInput     : [securityInputNeeded: "Yes", securityNoteNeeded: "No"],
    nextReviewDate    : [date: "14/12/2019"],
    prisonerBackground: [offenceDetails: "offence Details text"],
    riskAssessment    : [
      lowerCategory    : "lower category text",
      otherRelevant    : "No",
      higherCategory   : "higher category text",
    ]
  ]


  public static final defaultRecat = [
    decision          : [category: "C"],
    oasysInput        : [date: "14/12/2019", oasysRelevantInfo: "No"],
    securityInput     : [securityInputNeeded: "Yes", securityNoteNeeded: "No"],
    nextReviewDate    : [date: "14/12/2019"],
    prisonerBackground: [offenceDetails: "offence Details text"],
    riskAssessment    : [
      lowerCategory    : "lower security category text",
      otherRelevant    : "Yes",
      higherCategory   : "higher security category text",
      otherRelevantText: "other relevant information"
    ]
  ]

  public static final defaultOpenConditions = [
    earliestReleaseDate: ['fiveOrMoreYears': 'No'],
    foreignNational    : ['isForeignNational': 'No'],
    riskOfHarm         : ['seriousHarm': 'No'],
    furtherCharges     : ['increasedRisk': 'No', 'furtherChargesText': 'some charges,furtherChargesText details'],
    riskLevels         : ['likelyToAbscond': 'No']
  ]

  public static final FULL_HEADER = ['B2345YZ', '17/02/1970', 'C',
                                     'C-04-02', 'Coventry',
                                     'Latvian',
                                     'A Felony', 'Another Felony',
                                     '10/06/2020',
                                     '11/06/2020',
                                     '02/02/2020',
                                     '13/06/2020',
                                     '14/06/2020',
                                     '15/06/2020',
                                     '16/06/2020',
                                     '17/06/2020',
                                     '6 years, 3 months (Std sentence)']
  public static final MINI_HEADER = ['Hillmob, Ant', 'B2345YZ', '17/02/1970', 'C']

  public static final FULL_HEADER1 = ['ON700', '17/02/1970', 'U(Unsentenced)',
                                      'C-04-02', 'Coventry',
                                      'Latvian',
                                      'A Felony', 'Another Felony',
                                      '10/06/2020',
                                      '11/06/2020',
                                      '02/02/2020',
                                      '13/06/2020',
                                      '14/06/2020',
                                      '15/06/2020',
                                      '16/06/2020',
                                      '17/06/2020',
                                      '6 years, 3 months (Std sentence)']
  public static final FULL_HEADER2 = ['ON700', '17/02/1970', 'Closed',
                                      'C-04-02', 'Coventry',
                                      'Latvian',
                                      'A Felony', 'Another Felony',
                                      '10/06/2020',
                                      '11/06/2020',
                                      '02/02/2020',
                                      '13/06/2020',
                                      '14/06/2020',
                                      '15/06/2020',
                                      '16/06/2020',
                                      '17/06/2020',
                                      '6 years, 3 months (Std sentence)']
  public static final MINI_HEADER1 = ['Hillmob, William', 'ON700', '17/02/1970', 'Closed']


  TestFixture(
    Browser browser,
    Elite2Api elite2Api,
    OauthApi oauthApi,
    RiskProfilerApi riskProfilerApi1,
    AllocationApi allocationApi1,
    PrisonerSearchApi prisonerSearchApi,
    PathfinderApi pathfinderApi
  ) {
    this.browser = browser
    this.elite2Api = elite2Api
    this.riskProfilerApi = riskProfilerApi1
    this.allocationApi = allocationApi1
    this.prisonerSearchApi = prisonerSearchApi
    this.oauthApi = oauthApi
    this.pathfinderApi = pathfinderApi
  }

  def loginAs(UserAccount user) {
    stubLogin(user)
    // Redirect to /oauth/authorise and wiremock serves a dummy login page
    browser.go '/'
    simulateLogin()
  }

  def stubLogin(UserAccount user) {
    oauthApi.resetRequests()
    currentUser = user
    elite2Api.stubHealth()
    oauthApi.stubValidOAuthTokenRequest currentUser
    elite2Api.stubGetMyDetails currentUser
    elite2Api.stubGetMyCaseloads currentUser.caseloads
    allocationApi.stubGetPomByOffenderNo()
  }

  def gotoTasklist(transferToSecurity = false, multipleSentences = false) {
    elite2Api.stubUncategorised()
    def date11 = LocalDate.now().plusDays(-4).toString()
    def date12 = LocalDate.now().plusDays(-1).toString()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [11, 12], [date11, date12])

    loginAs(CATEGORISER_USER)
    browser.at CategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, false, 'C', multipleSentences)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', transferToSecurity)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 4)
    browser.selectSecondPrisoner()
  }

  def gotoInitialWomenTasklist(transferToSecurity = false, multipleSentences = false) {
    elite2Api.stubUncategorisedNoStatus(700, 'PFI')
    def sentenceStartDate11 = LocalDate.of(2019, 1, 28)
    def sentenceStartDate12 = LocalDate.of(2019, 1, 31)
    prisonerSearchApi.stubSentenceData(['ON700'], [700], [sentenceStartDate11.toString(), sentenceStartDate12.toString()])

    loginAs(FEMALE_USER)
    browser.at CategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, "ON700")
    riskProfilerApi.stubForTasklists('ON700', 'U(Unsentenced)', false)
    pathfinderApi.stubGetExtremismProfile('ON700', 3)
    browser.selectFirstPrisoner()
  }

  def gotoTasklistRecat(transferToSecurity = false, indeterminateSentence = false) {
    elite2Api.stubRecategorise()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners()
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(12, 'B2345YZ', false, indeterminateSentence)
    riskProfilerApi.stubForTasklists('B2345YZ', 'C', transferToSecurity)
    pathfinderApi.stubGetExtremismProfile('B2345YZ', 4)
    browser.selectFirstPrisoner()
  }

  def gotoTasklistRecatForWomen(transferToSecurity = false, indeterminateSentence = false) {
    elite2Api.stubRecategoriseWomen()
    prisonerSearchApi.stubGetPrisonerSearchPrisonersWomen()
    prisonerSearchApi.stubSentenceData(['ON700', 'ON701'], [700, 701], [LocalDate.now().toString(), LocalDate.now().toString()])

    loginAs(FEMALE_RECAT_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetailsWomen(700, 'ON700', false, indeterminateSentence, 'R')
    riskProfilerApi.stubForTasklists('ON700', 'R', transferToSecurity)
    pathfinderApi.stubGetExtremismProfile('ON700', 3)

    browser.waitFor {
      browser.selectFirstPrisoner()
    }
  }


  def gotoTasklistRecatForCatI(transferToSecurity = false) {
    elite2Api.stubRecategoriseWithCatI()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners(['1998-07-24', '1998-08-15'])
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(21, 'C0001AA', true, false, 'I')
    riskProfilerApi.stubForTasklists('C0001AA', 'I', transferToSecurity)
    pathfinderApi.stubGetExtremismProfile('C0001AA', 4)
    browser.selectFirstPrisoner() // should be Tim, Tiny, booking 21
  }

  def gotoTasklistRecatForCatIIndeterminate(transferToSecurity = false) {
    elite2Api.stubRecategoriseWithCatI()
    prisonerSearchApi.stubGetPrisonerSearchPrisoners(['1998-07-24', '1998-08-15'])
    prisonerSearchApi.stubSentenceData(['B2345XY', 'B2345YZ'], [12, 11], [LocalDate.now().toString(), LocalDate.now().toString()])

    loginAs(RECATEGORISER_USER)
    browser.at RecategoriserHomePage
    elite2Api.stubGetOffenderDetails(21, 'C0001AA', true, true, 'I')
    riskProfilerApi.stubForTasklists('C0001AA', 'C', transferToSecurity)
    pathfinderApi.stubGetExtremismProfile('C0001AA', 3)
    browser.selectFirstPrisoner()
  }

  def simulateLogin() {
    browser.waitFor { browser.$('h1').text() == 'Sign in' }
    def requests = oauthApi.getAllServeEvents()
    // print JsonOutput.toJson(requests)
    // Capture 'state' param for passport (-2 = last but one server request)
    if (requests.empty) throw new Exception("Cannot login, possible env config problem")
    def stateParam = requests[-1].request.queryParams['state']
    def state = stateParam ? stateParam.values[0] : requests[-2].request.queryParams['state'].values[0]
    // Simulate auth server calling the callback, which then gets a token (from wiremock) and goes to homepage
    browser.go "/sign-in/callback?code=codexxxx&state=$state"
  }

  def logout() {
    browser.waitFor {
      browser.$('a', href: '/sign-out').click()
    }
    browser.waitFor { browser.$('h1').text() == 'Sign in' }
  }

  def sameDate(LocalDate expected, actual) {
    return actual[0].toLocalDate().equals(expected)
  }

  def get10BusinessDays(LocalDate from = LocalDate.now()) {
    def numberOfDays = 14
    switch (from.get(ChronoField.DAY_OF_WEEK)) {
      case DayOfWeek.SATURDAY.value:
        numberOfDays += 2
        break
      case DayOfWeek.SUNDAY.value:
        numberOfDays += 1
        break
    }
    return numberOfDays
  }

  /**
   * Helper function to calculate the correct review date or overdue text
   */
  String calculateReviewDate(LocalDate sentenceStartDate) {
    def reviewDate = sentenceStartDate.plusDays(get10BusinessDays(sentenceStartDate))
    def today = LocalDate.now()

    if (reviewDate.isBefore(today)) {
      def overdueDays = ChronoUnit.DAYS.between(reviewDate, today)
      return overdueDays == 1 ? "1 day\noverdue" : "${overdueDays} days\noverdue"
    }
    return reviewDate.format('dd/MM/yyyy')
  }
}
