package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder
import com.github.tomakehurst.wiremock.common.FileSource
import com.github.tomakehurst.wiremock.core.WireMockConfiguration
import com.github.tomakehurst.wiremock.extension.Parameters
import com.github.tomakehurst.wiremock.extension.ResponseDefinitionTransformer
import com.github.tomakehurst.wiremock.http.Request
import com.github.tomakehurst.wiremock.http.ResponseDefinition
import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonBuilder
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import java.time.LocalDate

import static com.github.tomakehurst.wiremock.client.WireMock.*

class Elite2Api extends WireMockRule {

  Elite2Api() {
    super(new WireMockConfiguration().extensions(new UserListTransformer()).port(8080))
  }

  void stubGetMyDetails(UserAccount user) {
    stubGetMyDetails(user, user.workingCaseload.id)
  }

  void stubGetMyDetails(UserAccount user, String caseloadId) {
    this.stubFor(get('/api/users/me')
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([staffId         : user.staffMember.id,
                                     username        : user.username,
                                     firstName       : user.staffMember.firstName,
                                     lastName        : user.staffMember.lastName,
                                     email           : 'itaguser@syscon.net',
                                     activeCaseLoadId: caseloadId]))))
  }

  void stubGetUserDetails(UserAccount user, String caseloadId) {
    this.stubFor(get("/api/users/${user.username}")
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([staffId         : user.staffMember.id,
                                     username        : user.username,
                                     firstName       : user.staffMember.firstName,
                                     lastName        : user.staffMember.lastName,
                                     email           : 'itaguser@syscon.net',
                                     activeCaseLoadId: caseloadId]))))
  }

  void stubGetMyCaseloads(List<Caseload> caseloads) {
    def json = new JsonBuilder()
    json caseloads, { caseload ->
      caseLoadId caseload.id
      description caseload.description
      type caseload.type
      caseloadFunction 'DUMMY'
    }

    this.stubFor(get('/api/users/me/caseLoads')
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'application/json')
        .withBody(json.toString())))
  }

  void stubHealth() {
    this.stubFor(get('/ping')
      .willReturn(aResponse()
        .withStatus(200)
        .withHeader('Content-Type', 'text/plain')
        .withBody("pong")))
  }

  void stubUncategorised(statusList = ['UNCATEGORISED', 'AWAITING_APPROVAL']) {
    this.stubFor(get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId    : 12,
                                      offenderNo   : 'B2345XY',
                                      firstName    : 'PENELOPE',
                                      lastName     : 'PITSTOP',
                                      status       : statusList[0],
                                      assessmentSeq: 5,],
                                     [bookingId    : 11,
                                      offenderNo   : 'B2345YZ',
                                      firstName    : 'ANT',
                                      lastName     : 'HILLMOB',
                                      status       : statusList[1],
                                      assessmentSeq: 4,],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedFull() {
    this.stubFor(get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId : 31,
                                      offenderNo: 'B0031AA',
                                      firstName : 'AWAITING',
                                      lastName  : 'MISSING',
                                      status    : 'AWAITING_APPROVAL',
                                      category  : 'B',],
                                     [bookingId : 32,
                                      offenderNo: 'B0032AA',
                                      firstName : 'AWAITING',
                                      lastName  : 'STARTED',
                                      status    : 'AWAITING_APPROVAL',
                                      category  : 'C',],
                                     [bookingId : 33,
                                      offenderNo: 'B0033AA',
                                      firstName : 'AWAITING',
                                      lastName  : 'AWAITING',
                                      status    : 'AWAITING_APPROVAL',
                                      category  : 'B',],
                                     [bookingId : 34,
                                      offenderNo: 'B0034AA',
                                      firstName : 'AWAITING',
                                      lastName  : 'APPROVED',
                                      status    : 'AWAITING_APPROVAL',
                                      category  : 'C',],
                                     [bookingId : 35,
                                      offenderNo: 'B0035AA',
                                      firstName : 'UNCATEGORISED',
                                      lastName  : 'MISSING',
                                      status    : 'UNCATEGORISED',
                                      category  : 'B',],
                                     [bookingId : 36,
                                      offenderNo: 'B0036AA',
                                      firstName : 'UNCATEGORISED',
                                      lastName  : 'STARTED',
                                      status    : 'UNCATEGORISED',
                                      category  : 'C',],
                                     [bookingId : 37,
                                      offenderNo: 'B0037AA',
                                      firstName : 'UNCATEGORISED',
                                      lastName  : 'AWAITING',
                                      status    : 'UNCATEGORISED',
                                      category  : 'B',],
                                     [bookingId : 38,
                                      offenderNo: 'B0038AA',
                                      firstName : 'UNCATEGORISED',
                                      lastName  : 'APPROVED',
                                      status    : 'UNCATEGORISED',
                                      category  : 'C',],
                                     [bookingId : 39,
                                      offenderNo: 'B0039AA',
                                      firstName : 'AWAITING',
                                      lastName  : 'SUPERVISOR_BACK',
                                      status    : 'AWAITING_APPROVAL',
                                      category  : 'C',],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubRecategorise(assessStatusList = ['A', 'A', 'A', 'A']) {
    def today = LocalDate.now()
    final date = today.plusMonths(2)
    this.stubFor(get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS&date=$date")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId     : 12,
                                      offenderNo    : 'B2345XY',
                                      firstName     : 'PENELOPE',
                                      lastName      : 'PITSTOP',
                                      category      : 'C',
                                      nextReviewDate: today.minusDays(4).format('yyyy-MM-dd'),
                                      assessStatus  : assessStatusList[0]],
                                     [bookingId     : 11,
                                      offenderNo    : 'B2345YZ',
                                      firstName     : 'ANT',
                                      lastName      : 'HILLMOB',
                                      category      : 'D',
                                      nextReviewDate: today.minusDays(2).format('yyyy-MM-dd'),
                                      assessStatus  : assessStatusList[1]],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    this.stubFor(post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 21,
                                      offenderNo        : 'C0001AA',
                                      classificationCode: 'C',
                                      nextReviewDate    : today.minusDays(4).format('yyyy-MM-dd'),
                                      assessmentStatus  : assessStatusList[2]],
                                     [bookingId         : 22,
                                      offenderNo        : 'C0002AA',
                                      classificationCode: 'D',
                                      nextReviewDate    : today.minusDays(2).format('yyyy-MM-dd'),
                                      assessmentStatus  : assessStatusList[3]],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubRecategoriseWomen(assessStatusList = ['R']) {
    def today = LocalDate.now()
    final date = today.plusMonths(2)
    this.stubFor(get("/api/offender-assessments/category/PFI?type=RECATEGORISATIONS&date=$date")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId     : 700,
                                      offenderNo    : 'ON700',
                                      firstName     : 'ANT',
                                      lastName      : 'HILLMOB',
                                      category      : 'R',
                                      nextReviewDate: today.minusDays(4).format('yyyy-MM-dd'),
                                      assessStatus  : assessStatusList[0]],
                                     [bookingId     : 701,
                                      offenderNo    : 'ON701',
                                      firstName     : 'PENELOPE',
                                      lastName      : 'PITSTOP',
                                      category      : 'T',
                                      nextReviewDate: today.minusDays(2).format('yyyy-MM-dd'),
                                      assessStatus  : assessStatusList[1]],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    this.stubFor(post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 703,
                                      offenderNo        : 'ON703',
                                      classificationCode: 'R',
                                      nextReviewDate    : today.minusDays(4).format('yyyy-MM-dd'),
                                      assessmentStatus  : assessStatusList[2]],
                                     [bookingId         : 704,
                                      offenderNo        : 'ON704',
                                      classificationCode: 'T',
                                      nextReviewDate    : today.minusDays(2).format('yyyy-MM-dd'),
                                      assessmentStatus  : assessStatusList[3]],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }


  void stubRecategoriseWithCatI() {
    final date = LocalDate.now().plusMonths(2)
    this.stubFor(get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS&date=$date")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId     : 12,
                                      offenderNo    : 'B2345XY',
                                      firstName     : 'PENELOPE',
                                      lastName      : 'PITSTOP',
                                      category      : 'B',
                                      nextReviewDate: '2019-07-25',],
                                     [bookingId     : 11,
                                      offenderNo    : 'B2345YZ',
                                      firstName     : 'ANT',
                                      lastName      : 'HILLMOB',
                                      category      : 'C',
                                      nextReviewDate: '2019-07-27'],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    this.stubFor(post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 21,
                                      offenderNo        : 'C0001AA',
                                      classificationCode: 'C',
                                      nextReviewDate    : '2019-07-25',
                                      assessmentStatus  : 'A'],
                                     [bookingId         : 22,
                                      offenderNo        : 'C0002AA',
                                      classificationCode: 'D',
                                      nextReviewDate    : '2019-07-27',
                                      assessmentStatus  : 'A'],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubGetLatestCategorisationForOffenders() {
    this.stubFor(post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 12,
                                      offenderNo        : 'B2345XY',
                                      classificationCode: 'C',
                                      nextReviewDate    : '2019-07-25',
                                      assessmentStatus  : 'A']]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubGetLatestCategorisationForWomenOffenders() {
    this.stubFor(post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 700,
                                      offenderNo        : 'ON700',
                                      classificationCode: 'R',
                                      nextReviewDate    : '2019-07-25',
                                      assessmentStatus  : 'No CAT A, Restricted']]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubCategorised(bookingIds = [11, 12]) {
    def response = []
    if (bookingIds.contains(10)) {
      response.add([offenderNo          : 'B1234AB',
                    bookingId           : 10,
                    firstName           : 'PETER',
                    lastName            : 'PERFECT',
                    assessmentDate      : '2018-03-28',
                    approvalDate        : '2019-03-20',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'DICK',
                    categoriserLastName : 'DASTARDLY',
                    approverFirstName   : 'PAT',
                    approverLastName    : 'PENDING',
                    category            : 'B'])
    }
    if (bookingIds.contains(11)) {
      response.add([offenderNo          : 'B2345YZ',
                    bookingId           : 11,
                    firstName           : 'SARAH',
                    lastName            : 'HEMMEL',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-02-20',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'JANE',
                    categoriserLastName : 'FAN',
                    approverFirstName   : 'JAMES',
                    approverLastName    : 'HELLY',
                    category            : 'C'])
    }
    if (bookingIds.contains(12)) {
      response.add([offenderNo          : 'B2345XY',
                    bookingId           : 12,
                    firstName           : 'TIM',
                    lastName            : 'SCRAMBLE',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-02-21',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'JOHN',
                    categoriserLastName : 'LAMB',
                    category            : 'C'])
    }
    if (bookingIds.contains(700)) {
      response.add([offenderNo          : 'ON700',
                    bookingId           : 700,
                    firstName           : 'WILLIAM',
                    lastName            : 'HILLMOB',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-02-21',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'JOHN',
                    categoriserLastName : 'LAMB',
                    category            : 'R'])
    }
    this.stubFor(post("/api/offender-assessments/category?latestOnly=false")
      .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, true))
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(response))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubCategorisedMultiple(bookingIds = [11, 12]) {
    def response = []
    if (bookingIds.contains(10)) {
      response.add([offenderNo          : 'B1234AB',
                    bookingId           : 10,
                    firstName           : 'PETER',
                    lastName            : 'PERFECT',
                    assessmentDate      : '2018-03-28',
                    approvalDate        : '2019-01-19',
                    assessmentSeq       : 5,
                    categoriserFirstName: 'SIMON',
                    categoriserLastName : 'TABLE',
                    approverFirstName   : 'SAM',
                    approverLastName    : 'HAND',
                    category            : 'B'])
      response.add([offenderNo          : 'B1234AB',
                    bookingId           : 10,
                    firstName           : 'PETER',
                    lastName            : 'PERFECT',
                    assessmentDate      : '2018-03-28',
                    approvalDate        : '2019-03-20',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'DICK',
                    categoriserLastName : 'DASTARDLY',
                    approverFirstName   : 'PAT',
                    approverLastName    : 'PENDING',
                    category            : 'B'])
    }
    if (bookingIds.contains(11)) {
      response.add([offenderNo          : 'B2345YZ',
                    bookingId           : 11,
                    firstName           : 'SARAH',
                    lastName            : 'HEMMEL',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-02-28',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'JANE',
                    categoriserLastName : 'FAN',
                    approverFirstName   : 'JAMES',
                    approverLastName    : 'HELLY',
                    category            : 'C'])
      response.add([offenderNo          : 'B2345YZ',
                    bookingId           : 11,
                    firstName           : 'SARAH',
                    lastName            : 'HEMMEL',
                    assessmentDate      : '2017-04-28',
                    approvalDate        : '2019-04-29',
                    assessmentSeq       : 8,
                    categoriserFirstName: 'JANE',
                    categoriserLastName : 'FAN',
                    approverFirstName   : 'JAMES',
                    approverLastName    : 'HELLY',
                    category            : 'C'])
    }
    if (bookingIds.contains(12)) {
      response.add([offenderNo          : 'B2345XY',
                    bookingId           : 12,
                    firstName           : 'TIM',
                    lastName            : 'SCRAMBLE',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-02-21',
                    assessmentSeq       : 7,
                    categoriserFirstName: 'JOHN',
                    categoriserLastName : 'LAMB',
                    approverFirstName   : 'JAMES',
                    approverLastName    : 'HELLY',
                    category            : 'C'])
      response.add([offenderNo          : 'B2345XY',
                    bookingId           : 12,
                    firstName           : 'TIM',
                    lastName            : 'SCRAMBLE',
                    assessmentDate      : '2017-03-27',
                    approvalDate        : '2019-04-20',
                    assessmentSeq       : 8,
                    categoriserFirstName: 'JOHN',
                    categoriserLastName : 'LAMB',
                    approverFirstName   : 'JAMES',
                    approverLastName    : 'HELLY',
                    category            : 'C'])
    }
    this.stubFor(post("/api/offender-assessments/category?latestOnly=false")
      .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, true))
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(response))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedAwaitingApproval() {
    this.stubFor(get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId           : 11,
                                      offenderNo          : 'B2345XY',
                                      firstName           : 'PENELOPE',
                                      lastName            : 'PITSTOP',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'B',
                                      categoriserFirstName: 'ROGER',
                                      categoriserLastName : 'RABBIT',
                                      assessmentSeq       : 4,],
                                     [bookingId           : 12,
                                      offenderNo          : 'B2345YZ',
                                      firstName           : 'ANT',
                                      lastName            : 'HILLMOB',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'C',
                                      categoriserFirstName: 'BUGS',
                                      categoriserLastName : 'BUNNY',
                                      assessmentSeq       : 5,],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedAwaitingApproval(location) {
    this.stubFor(get("/api/offender-assessments/category/${location}?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId           : 700,
                                      offenderNo          : 'ON700',
                                      firstName           : 'WILLIAM',
                                      lastName            : 'HILLMOB',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'R',
                                      categoriserFirstName: 'BUGS',
                                      categoriserLastName : 'BUNNY',
                                      assessmentSeq       : 5,],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedAwaitingApprovalForWomenYOI(location) {
    this.stubFor(get("/api/offender-assessments/category/${location}?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId           : 21,
                                      offenderNo          : 'C0001AA',
                                      firstName           : 'TINY',
                                      lastName            : 'TIM',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'I',
                                      categoriserFirstName: 'BUGS',
                                      categoriserLastName : 'BUNNY',
                                      assessmentSeq       : 5,],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }



  void stubUncategorisedForSupervisorFull() {
    this.stubFor(get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId           : 31,
                                      offenderNo          : 'B0031AA',
                                      firstName           : 'AWAITING',
                                      lastName            : 'MISSING',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'B',
                                      categoriserFirstName: 'ROGER',
                                      categoriserLastName : 'RABBIT',
                                      nextReviewDate      : '2019-01-15',],
                                     [bookingId           : 32,
                                      offenderNo          : 'B0032AA',
                                      firstName           : 'AWAITING',
                                      lastName            : 'STARTED',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'C',
                                      categoriserFirstName: 'BUGS',
                                      categoriserLastName : 'BUNNY',
                                      nextReviewDate      : '2019-01-16',],
                                     [bookingId           : 33,
                                      offenderNo          : 'B0033AA',
                                      firstName           : 'AWAITING',
                                      lastName            : 'AWAITING',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'B',
                                      categoriserFirstName: 'ROGER',
                                      categoriserLastName : 'RABBIT',
                                      nextReviewDate      : '2019-01-17',
                                      assessmentSeq       : 3,],
                                     [bookingId           : 34,
                                      offenderNo          : 'B0034AA',
                                      firstName           : 'AWAITING',
                                      lastName            : 'APPROVED',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'C',
                                      categoriserFirstName: 'BUGS',
                                      categoriserLastName : 'BUNNY',
                                      nextReviewDate      : '2019-01-18',],
                                     [bookingId           : 35,
                                      offenderNo          : 'B0035AA',
                                      firstName           : 'AWAITING',
                                      lastName            : 'MISSING',
                                      status              : 'UNCATEGORISED',
                                      category            : 'B',
                                      categoriserFirstName: 'ROGER',
                                      categoriserLastName : 'RABBIT',
                                      nextReviewDate      : '2019-01-19',

                                     ],
                                     [bookingId           : 36,
                                      offenderNo          : 'B0036AA',
                                      firstName           : 'MR',
                                      lastName            : 'RECAT',
                                      status              : 'AWAITING_APPROVAL',
                                      category            : 'B',
                                      categoriserFirstName: 'ROGER',
                                      categoriserLastName : 'RABBIT',
                                      nextReviewDate      : '2019-02-01',
                                      assessmentSeq       : 6,],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedNoStatus(bookingId) {
    this.stubFor(get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId : bookingId,
                                      offenderNo: "ON${bookingId}",
                                      firstName : 'HARRY',
                                      lastName  : 'BONNET',
                                      status    : 'UNCATEGORISED',],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }


  void stubUncategorisedNoStatus(bookingId, location) {
    this.stubFor(get("/api/offender-assessments/category/${location}?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId : bookingId,
                                      offenderNo: "ON${bookingId}",
                                      firstName : 'WILLIAM',
                                      lastName  : 'BONNET',
                                      status    : 'UNCATEGORISED',],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  void stubUncategorisedForWomenYOI(bookingId, location) {
    this.stubFor(get("/api/offender-assessments/category/${location}?type=UNCATEGORISED")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId : bookingId,
                                      offenderNo: 'C0001AA',
                                      firstName : 'TINY',
                                      lastName  : 'TIM',
                                      status    : 'UNCATEGORISED',],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubSentenceDataGetSingle(String offenderNo, String formattedReleaseDate) {
    def response = [[offenderNo    : offenderNo,
                     bookingId     : -45,
                     firstName     : 'firstName',
                     lastName      : 'lastName',
                     sentenceDetail: [bookingId: -45, releaseDate: formattedReleaseDate]],
                    [offenderNo    : offenderNo,
                     bookingId     : -55,
                     firstName     : 'firstName',
                     lastName      : 'lastName',
                     sentenceDetail: [bookingId: -55, releaseDate: formattedReleaseDate]],
                    [offenderNo    : offenderNo,
                     bookingId     : 12,
                     firstName     : 'firstName12',
                     lastName      : 'lastName12',
                     sentenceDetail: [bookingId: 12, releaseDate: '2020-11-30']],]

    this.stubFor(get("/api/offender-sentences?offenderNo=${offenderNo}")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(response))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetOffenderDetailsByOffenderNoList(List offenderNumbers) {
    this.stubFor(post("/api/bookings/offenders?activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId  : 13,
                                      offenderNo : offenderNumbers[0],
                                      agencyId   : 'LEI',
                                      firstName  : 'FRANK',
                                      lastName   : 'CLARK',
                                      dateOfBirth: '1970-02-17',],
                                     [bookingId  : 14,
                                      offenderNo : offenderNumbers[1],
                                      agencyId   : 'LEI',
                                      firstName  : 'JANE',
                                      lastName   : 'DENT',
                                      dateOfBirth: '1970-02-17',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetOffenderDetailsByOffenderNoList(bookingId, offenderNo) {
    this.stubFor(post("/api/bookings/offenders?activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId  : bookingId,
                                      offenderNo : offenderNo,
                                      agencyId   : 'LEI',
                                      firstName  : 'JANE',
                                      lastName   : 'DENT',
                                      dateOfBirth: '1970-02-17',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetOffenderDetailsByOffenderNoListWomen(bookingId, offenderNo) {
    this.stubFor(post("/api/bookings/offenders?activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId  : bookingId,
                                      offenderNo : offenderNo,
                                      agencyId   : 'PFI',
                                      firstName  : 'JANE',
                                      lastName   : 'DENT',
                                      dateOfBirth: '1970-02-17',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetStaffDetailsByUsernameList() {
    this.stubFor(post("/api/users/list")
      .willReturn(aResponse()
        .withTransformers("UserListTransformer")))
  }

  static class UserListTransformer extends ResponseDefinitionTransformer {

    @Override
    ResponseDefinition transform(Request request, ResponseDefinition responseDefinition, FileSource files, Parameters parameters) {
      def body = new JsonSlurper().parseText(request.getBodyAsString())
      def response = []
      body.unique().each {
        response.add([staffId         : 123,
                      username        : it,
                      firstName       : 'firstName_' + it,
                      lastName        : 'lastName_' + it,
                      email           : 'itaguser@syscon.net',
                      activeCaseLoadId: 'LEI'])
      }
      return new ResponseDefinitionBuilder()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)
        .withBody(JsonOutput.toJson(response))
        .build()
    }

    @Override
    String getName() {
      return "UserListTransformer"
    }

    @Override
    boolean applyGlobally() {
      return false
    }
  }

  def stubGetOffenderDetails(int bookingId, offenderNo = 'B2345YZ', youngOffender = false, indeterminateSentence = false, category = 'C', multipleSentences = false, nextReviewDate = '2020-01-16') {
    this.stubFor(get("/api/bookings/$bookingId?basicInfo=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId         : bookingId,
                                     offenderNo        : offenderNo,
                                     agencyId          : 'LEI',
                                     firstName         : 'ANT',
                                     lastName          : 'HILLMOB',
                                     dateOfBirth       : youngOffender ? '2018-01-01' : '1970-02-17',
                                     category          : 'Cat ' + category,
                                     categoryCode      : category,
                                     assessments       : nextReviewDate ? [[assessmentCode: 'CATEGORY',
                                                                            nextReviewDate: nextReviewDate,],] : null,
                                     assignedLivingUnit: [description: 'C-04-02',
                                                          agencyName : 'Coventry',],
                                     profileInformation: [[type       : 'IMM',
                                                           resultValue: 'Other'],
                                                          [type       : 'NAT',
                                                           resultValue: 'Latvian']],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))


    def sentenceDetail = [bookingId                         : bookingId,
                          sentenceStartDate                 : '2019-08-15',
                          homeDetentionCurfewEligibilityDate: '2020-06-10',
                          paroleEligibilityDate             : '2020-06-13',
                          nonParoleDate                     : '2020-06-14',
                          tariffDate                        : '2020-06-15',
                          licenceExpiryDate                 : '2020-06-16',
                          sentenceExpiryDate                : '2020-06-17',]
    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = LocalDate.now().toString()
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = LocalDate.now().plusYears(4).format('yyyy-MM-dd') // > 3
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    this.stubFor(get("/api/bookings/$bookingId/sentenceDetail")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(sentenceDetail))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    final terms = [[bookingId              : bookingId,
                    sentenceSequence       : 2,
                    termSequence           : 1,
                    sentenceType           : "T1",
                    sentenceTypeDescription: "Std sentence",
                    startDate              : "2018-12-31",
                    years                  : 6,
                    months                 : 3,
                    lifeSentence           : indeterminateSentence]]
    if (multipleSentences) {
      terms.add([bookingId              : bookingId,
                 sentenceSequence       : 4,
                 termSequence           : 1,
                 consecutiveTo          : 2,
                 sentenceType           : "R",
                 sentenceTypeDescription: "Recall 14 days",
                 startDate              : "2019-03-31",
                 years                  : 4,
                 months                 : 2,
                 lifeSentence           : false])
    }
    this.stubFor(get("/api/offender-sentences/booking/$bookingId/sentenceTerms")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(terms))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
    this.stubFor(get("/api/bookings/$bookingId/mainOffence")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : bookingId,
                                      offenceDescription: 'A Felony',],
                                     [bookingId         : bookingId,
                                      offenceDescription: 'Another Felony',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetOffenderDetailsWomen(int bookingId, offenderNo = 'ON700', youngOffender = false, indeterminateSentence = false, category, multipleSentences = false, nextReviewDate = '2020-01-16') {
    this.stubFor(get("/api/bookings/$bookingId?basicInfo=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId         : bookingId,
                                     offenderNo        : offenderNo,
                                     agencyId          : 'PFI',
                                     firstName         : 'WILLIAM',
                                     lastName          : 'HILLMOB',
                                     dateOfBirth       : youngOffender ? '2018-01-01' : '1970-02-17',
                                     category          : 'Cat ' + category,
                                     categoryCode      : category,
                                     assessments       : nextReviewDate ? [[assessmentCode: 'CATEGORY',
                                                                            nextReviewDate: nextReviewDate,],] : null,
                                     assignedLivingUnit: [description: 'C-04-02',
                                                          agencyName : 'Coventry',],
                                     profileInformation: [[type       : 'IMM',
                                                           resultValue: 'Other'],
                                                          [type       : 'NAT',
                                                           resultValue: 'Latvian']],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))


    def sentenceDetail = [bookingId                         : bookingId,
                          sentenceStartDate                 : '2019-08-15',
                          homeDetentionCurfewEligibilityDate: '2020-06-10',
                          paroleEligibilityDate             : '2020-06-13',
                          nonParoleDate                     : '2020-06-14',
                          tariffDate                        : '2020-06-15',
                          licenceExpiryDate                 : '2020-06-16',
                          sentenceExpiryDate                : '2020-06-17',]
    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = LocalDate.now().toString()
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = LocalDate.now().plusYears(4).format('yyyy-MM-dd') // > 3
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    this.stubFor(get("/api/bookings/$bookingId/sentenceDetail")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(sentenceDetail))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    final terms = [[bookingId                         : bookingId,
                    sentenceSequence       : 2,
                    termSequence           : 1,
                    sentenceType           : "T1",
                    sentenceTypeDescription: "Std sentence",
                    startDate              : "2018-12-31",
                    years                  : 6,
                    months                 : 3,
                    lifeSentence           : indeterminateSentence]]
    if (multipleSentences) {
      terms.add([bookingId              : bookingId,
                 sentenceSequence       : 4,
                 termSequence           : 1,
                 consecutiveTo          : 2,
                 sentenceType           : "R",
                 sentenceTypeDescription: "Recall 14 days",
                 startDate              : "2019-03-31",
                 years                  : 4,
                 months                 : 2,
                 lifeSentence           : false])
    }
    this.stubFor(get("/api/offender-sentences/booking/$bookingId/sentenceTerms")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(terms))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
    this.stubFor(get("/api/bookings/$bookingId/mainOffence")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : bookingId,
                                      offenceDescription: 'A Felony',],
                                     [bookingId         : bookingId,
                                      offenceDescription: 'Another Felony',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }


  def stubGetOffenderDetailsWomenYOI(int bookingId, offenderNo = 'C0001AA', youngOffender = true, indeterminateSentence = false, category, multipleSentences = false, nextReviewDate = '2020-01-16') {
    this.stubFor(get("/api/bookings/$bookingId?basicInfo=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId         : bookingId,
                                     offenderNo        : offenderNo,
                                     agencyId          : 'PFI',
                                     firstName         : 'TINY',
                                     lastName          : 'TIM',
                                     dateOfBirth       : youngOffender ? '2005-01-01' : '1970-02-17',
                                     category          : 'Cat ' + category,
                                     categoryCode      : category,
                                     assessments       : nextReviewDate ? [[assessmentCode: 'CATEGORY',
                                                                            nextReviewDate: nextReviewDate,],] : null,
                                     assignedLivingUnit: [description: 'C-04-02',
                                                          agencyName : 'Coventry',],
                                     profileInformation: [[type       : 'IMM',
                                                           resultValue: 'Other'],
                                                          [type       : 'NAT',
                                                           resultValue: 'Latvian']],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))


    def sentenceDetail = [bookingId                         : bookingId,
                          sentenceStartDate                 : '2019-08-15',
                          homeDetentionCurfewEligibilityDate: '2020-06-10',
                          paroleEligibilityDate             : '2020-06-13',
                          nonParoleDate                     : '2020-06-14',
                          tariffDate                        : '2020-06-15',
                          licenceExpiryDate                 : '2020-06-16',
                          sentenceExpiryDate                : '2020-06-17',]
    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = LocalDate.now().toString()
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = LocalDate.now().plusYears(4).format('yyyy-MM-dd') // > 3
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    this.stubFor(get("/api/bookings/$bookingId/sentenceDetail")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(sentenceDetail))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))

    final terms = [[bookingId              : bookingId,
                    sentenceSequence       : 2,
                    termSequence           : 1,
                    sentenceType           : "T1",
                    sentenceTypeDescription: "Std sentence",
                    startDate              : "2018-12-31",
                    years                  : 6,
                    months                 : 3,
                    lifeSentence           : indeterminateSentence]]
    this.stubFor(get("/api/offender-sentences/booking/$bookingId/sentenceTerms")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(terms))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
    this.stubFor(get("/api/bookings/$bookingId/mainOffence")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : bookingId,
                                      offenceDescription: 'A Felony',],
                                     [bookingId         : bookingId,
                                      offenceDescription: 'Another Felony',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }


  def stubGetBasicOffenderDetails(int bookingId, offenderNo = 'B2345YZ') {
    this.stubFor(get("/api/bookings/$bookingId?basicInfo=true")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId  : bookingId,
                                     offenderNo : offenderNo,
                                     agencyId   : 'LEI',
                                     firstName  : 'ANT',
                                     lastName   : 'HILLMOB',
                                     dateOfBirth: '1970-02-17',]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def verifyGetBasicOffenderDetails(int bookingId) {
    verify(getRequestedFor(urlEqualTo("/api/bookings/$bookingId?basicInfo=true")))
  }

  def stubGetFullOffenderDetails(int bookingId, offenderNo) {
    this.stubFor(get("/api/bookings/offenderNo/$offenderNo?fullInfo=true")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId   : bookingId,
                                     offenderNo  : offenderNo,
                                     agencyId    : 'LEI',
                                     firstName   : 'ANT',
                                     lastName    : 'HILLMOB',
                                     dateOfBirth : '1970-02-17',
                                     categoryCode: 'C',]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def verifyGetFullOffenderDetails(offenderNo) {
    verify(getRequestedFor(urlEqualTo("/api/bookings/offenderNo/$offenderNo?fullInfo=true")))
  }

  def stubOffenceHistory(offenderNo) {
    this.stubFor(get("/api/bookings/offenderNo/$offenderNo/offenceHistory")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId         : 12,
                                      offenceDescription: 'Libel',
                                      offenceDate       : '2019-02-21',],
                                     [bookingId         : 12,
                                      offenceDescription: 'Slander',
                                      offenceDate       : '2019-02-22',
                                      offenceRangeDate  : '2019-02-24',],
                                     [bookingId         : 12,
                                      offenceDescription: 'Undated offence',]]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubAssessments(String offenderNo, Boolean emptyResponse = false, bookingId = -45) {
    this.stubFor(get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(emptyResponse ? [] : [[bookingId            : bookingId,
                                                           offenderNo           : offenderNo,
                                                           classificationCode   : 'A',
                                                           classification       : 'Cat A',
                                                           assessmentCode       : 'CATEGORY',
                                                           assessmentDescription: 'Categorisation',
                                                           cellSharingAlertFlag : false,
                                                           assessmentDate       : '2012-04-04',
                                                           nextReviewDate       : '2012-06-07',
                                                           approvalDate         : '2012-06-08',
                                                           assessmentAgencyId   : "LPI",
                                                           assessmentStatus     : 'A'],
                                                          [bookingId            : bookingId,
                                                           offenderNo           : offenderNo,
                                                           classificationCode   : 'A',
                                                           classification       : 'Cat A',
                                                           assessmentCode       : 'CATEGORY',
                                                           assessmentDescription: 'Categorisation',
                                                           cellSharingAlertFlag : false,
                                                           assessmentDate       : '2012-03-28',
                                                           nextReviewDate       : '2012-06-07',
                                                           assessmentAgencyId   : "LPI",
                                                           assessmentStatus     : 'P'],
                                                          [bookingId            : bookingId,
                                                           offenderNo           : offenderNo,
                                                           classificationCode   : 'B',
                                                           classification       : 'Cat B',
                                                           assessmentCode       : 'CATEGORY',
                                                           assessmentDescription: 'Categorisation',
                                                           cellSharingAlertFlag : false,
                                                           assessmentDate       : '2013-03-24',
                                                           nextReviewDate       : '2013-09-17',
                                                           approvalDate         : '2013-03-24',
                                                           assessmentAgencyId   : "LPI",
                                                           assessmentStatus     : 'I']]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubAssessmentsWomen(String offenderNo, Boolean emptyResponse = false, bookingId = -45) {
    this.stubFor(get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson(emptyResponse ? [] : [[bookingId            : bookingId,
                                                           offenderNo           : offenderNo,
                                                           classification       : 'No Cat A',
                                                           assessmentCode       : 'CATEGORY',
                                                           assessmentDescription: 'Categorisation',
                                                           cellSharingAlertFlag : false,
                                                           assessmentDate       : '2012-04-04',
                                                           nextReviewDate       : '2012-06-07',
                                                           approvalDate         : '2012-06-08',
                                                           assessmentAgencyId   : "PFI",
                                                           assessmentStatus     : 'No CAT A, Restricted'],
                                                          ]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }


  def stubAssessmentsWithCurrent(String offenderNo) {
    this.stubFor(get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[bookingId            : -45,
                                      offenderNo           : offenderNo,
                                      classificationCode   : 'A',
                                      classification       : 'Cat A',
                                      assessmentCode       : 'CATEGORY',
                                      assessmentDescription: 'Categorisation',
                                      cellSharingAlertFlag : false,
                                      assessmentDate       : '2012-04-04',
                                      nextReviewDate       : '2012-06-07',
                                      approvalDate         : '2012-06-08',
                                      assessmentAgencyId   : "LPI",
                                      assessmentStatus     : 'A',
                                      assessmentSeq        : 1],
                                     [bookingId            : -45,
                                      offenderNo           : offenderNo,
                                      classificationCode   : 'A',
                                      classification       : 'Cat A',
                                      assessmentCode       : 'CATEGORY',
                                      assessmentDescription: 'Categorisation',
                                      cellSharingAlertFlag : false,
                                      assessmentDate       : '2012-03-28',
                                      nextReviewDate       : '2012-06-07',
                                      assessmentAgencyId   : "LPI",
                                      assessmentStatus     : 'P',
                                      assessmentSeq        : 2],
                                     [bookingId            : -45,
                                      offenderNo           : offenderNo,
                                      classificationCode   : 'B',
                                      classification       : 'Cat B',
                                      assessmentCode       : 'CATEGORY',
                                      assessmentDescription: 'Categorisation',
                                      cellSharingAlertFlag : false,
                                      assessmentDate       : '2013-03-24',
                                      nextReviewDate       : '2013-09-17',
                                      approvalDate         : '2013-03-24',
                                      assessmentAgencyId   : "LPI",
                                      assessmentStatus     : 'I',
                                      assessmentSeq        : 3],
                                     [bookingId            : 12,
                                      offenderNo           : offenderNo,
                                      classificationCode   : 'P',
                                      classification       : 'Prov Cat A',
                                      assessmentCode       : 'CATEGORY',
                                      assessmentDescription: 'Cat A in current booking',
                                      cellSharingAlertFlag : false,
                                      assessmentDate       : '2018-04-04',
                                      nextReviewDate       : '2018-06-07',
                                      approvalDate         : '2018-06-08',
                                      assessmentAgencyId   : "LPI",
                                      assessmentStatus     : 'I',
                                      assessmentSeq        : 4],
                                     [bookingId            : 12,
                                      offenderNo           : offenderNo,
                                      classificationCode   : 'U',
                                      classification       : 'Unsentenced',
                                      assessmentCode       : 'CATEGORY',
                                      assessmentDescription: 'Current booking',
                                      cellSharingAlertFlag : false,
                                      assessmentDate       : '2019-03-28',
                                      nextReviewDate       : '2019-06-07',
                                      approvalDate         : '2019-06-18',
                                      assessmentAgencyId   : "LPI",
                                      assessmentStatus     : 'A',
                                      assessmentSeq        : 5],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubAssessmentsEmpty() {
    this.stubFor(get(urlMatching("/api/offender-assessments/CATEGORY\\?offenderNo=\\w+&latestOnly=false&activeOnly=false"))
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubCategorise(String expectedCat, String nextReviewDate, long bookingId = 12, sequenceNumber = 4, committee = 'OCA') {
    def expectedBody = [bookingId: bookingId, category: expectedCat, committee: committee, nextReviewDate: nextReviewDate]
    stubCategorise(expectedBody, sequenceNumber)
  }


  def stubCategoriseWomen(String expectedCat, String nextReviewDate, long bookingId = 700, sequenceNumber = 4, committee = 'OCA') {
    def expectedBody = [bookingId: bookingId, category: expectedCat, committee: committee, nextReviewDate: nextReviewDate]
    stubCategorise(expectedBody, sequenceNumber)
  }


  def stubCategorise(Map expectedBody, sequenceNumber) {

    this.stubFor(post("/api/offender-assessments/category/categorise")
      .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([bookingId     : expectedBody.bookingId,
                                     sequenceNumber: sequenceNumber]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(201)))
  }


  def stubCategoriseUpdate(String expectedCat, String nextReviewDate, long bookingId, sequenceNumber) {

    def expectedBody = [bookingId: bookingId, assessmentSeq: sequenceNumber, category: expectedCat, committee: 'OCA', nextReviewDate: nextReviewDate]

    this.stubFor(put("/api/offender-assessments/category/categorise")
      .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
      .willReturn(aResponse()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubCategoriseError() {

    this.stubFor(post("/api/offender-assessments/category/categorise")
      .willReturn(aResponse()
        .withStatus(500)))
  }

  def stubSupervisorApprove(String expectedCat) {
    stubSupervisorApprove([category: expectedCat, reviewCommitteeCode: 'OCA'])
  }

  def stubSupervisorApprove(Map expectedBody) {

    this.stubFor(put("/api/offender-assessments/category/approve")
      .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
      .willReturn(aResponse()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubSupervisorApproveNoPendingAssessmentError(Map expectedBody) {
    def category = expectedBody.get("category")
    def bookingId = expectedBody.get("bookingId")
    def assessmentSeq = expectedBody.get("assessmentSeq")

    this.stubFor(put("/api/offender-assessments/category/approve")
      .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
      .willReturn(aResponse()
        .withStatus(400)
        .withHeader('Content-Type', 'application/json')
        .withBody(JsonOutput.toJson([developerMessage: "400 No pending category assessment found, $category, booking $bookingId, seq $assessmentSeq",
                                     status          : 400,
                                     userMessage     : "No pending category assessment found, category $category, booking $bookingId, seq $assessmentSeq"]))))
  }

  def stubSupervisorReject(String bookingId, int assessmentSeq, evaluationDate) {

    this.stubFor(put("/api/offender-assessments/category/reject")
      .withRequestBody(equalToJson(JsonOutput.toJson([bookingId: bookingId, assessmentSeq: assessmentSeq, reviewCommitteeCode: 'OCA', evaluationDate: evaluationDate]), true, true))
      .willReturn(aResponse()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubUpdateNextReviewDate(String date) {

    this.stubFor(put("/api/offender-assessments/category/12/nextReviewDate/${date}")
      .willReturn(aResponse()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def verifyUpdateNextReviewDate(String date) {
    verify(putRequestedFor(urlMatching("/api/offender-assessments/category/12/nextReviewDate/${date}")))
  }

  def stubSetInactive(bookingId, status) {

    this.stubFor(put("/api/offender-assessments/category/${bookingId}/inactive?status=${status}")
      .willReturn(aResponse()
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def verifySetInactive() {
    verify(putRequestedFor(urlMatching("/api/offender-assessments/category/12/inactive\\?status=\\w+")))
  }

  def stubAgencyDetails(agency) {

    this.stubFor(get("/api/agencies/$agency?activeOnly=false")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([agencyId   : agency,
                                     description: "$agency prison",
                                     agencyType : "INST"]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubAgenciesPrison() {
    this.stubFor(get("/api/agencies/prison")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[agencyId: 'SYI', description: 'SHREWSBURY (HMP)'],
                                     [agencyId: 'BXI', description: 'BRIXTON (HMP)'],
                                     [agencyId: 'MDI', description: 'MOORLAND'],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetIdentifiersByBookingId(bookingId) {
    this.stubFor(get("/api/bookings/$bookingId/identifiers")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([[type: 'MERGED', value: 'A1234AA'],
                                     [type: 'OTHER', value: 'Z9999ZZ)'],]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }

  def stubGetAssaultIncidents(prisonerNumber) {
    this.stubFor(get("/api/offenders/$prisonerNumber/incidents?incidentType=ASSAULT&incidentType=ASSAULTS3&participationRoles=ACTINV&participationRoles=ASSIAL&participationRoles=FIGHT&participationRoles=IMPED&participationRoles=PERP&participationRoles=SUSASS&participationRoles=SUSINV")
      .willReturn(aResponse()
        .withBody(JsonOutput.toJson([
          [incidentStatus: 'SOMETHING', reportTime: LocalDate.now().minusDays(2).format('yyyy-MM-dd'), responses: [[question: 'WAS THIS A SEXUAL ASSAULT', answer: 'YES']]],
          [incidentStatus: 'SOMETHING', reportTime: LocalDate.now().minusDays(2).format('yyyy-MM-dd'), responses: [[question: 'WAS THIS A SEXUAL ASSAULT', answer: 'YES']]],
          [incidentStatus: 'SOMETHING', reportTime: LocalDate.now().minusDays(2).format('yyyy-MM-dd'), responses: [[question: 'SOMETHING', answer: 'YES']]],
          [incidentStatus: 'SOMETHING', reportTime: LocalDate.now().minusDays(2).format('yyyy-MM-dd'), responses: [[question: 'SOMETHING', answer: 'YES']]],
          [incidentStatus: 'SOMETHING', reportTime: LocalDate.now().minusDays(2).format('yyyy-MM-dd'), responses: [[question: 'SOMETHING', answer: 'YES']]],
        ]))
        .withHeader('Content-Type', 'application/json')
        .withStatus(200)))
  }
}
