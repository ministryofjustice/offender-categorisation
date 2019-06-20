package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonBuilder
import groovy.json.JsonOutput
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import java.time.LocalDate

import static com.github.tomakehurst.wiremock.client.WireMock.*

class Elite2Api extends WireMockRule {

  Elite2Api() {
    super(8080)
  }

  void stubGetMyDetails(UserAccount user) {
    stubGetMyDetails(user, Caseload.LEI.id)
  }

  void stubGetMyDetails(UserAccount user, String caseloadId) {
    this.stubFor(
      get('/api/users/me')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              staffId         : user.staffMember.id,
              username        : user.username,
              firstName       : user.staffMember.firstName,
              lastName        : user.staffMember.lastName,
              email           : 'itaguser@syscon.net',
              activeCaseLoadId: caseloadId
            ]))))
  }

  void stubGetUserDetails(UserAccount user, String caseloadId) {
    this.stubFor(
      get("/api/users/${user.username}")
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(JsonOutput.toJson([
              staffId         : user.staffMember.id,
              username        : user.username,
              firstName       : user.staffMember.firstName,
              lastName        : user.staffMember.lastName,
              email           : 'itaguser@syscon.net',
              activeCaseLoadId: caseloadId
            ]))))
  }

  void stubGetMyCaseloads(List<Caseload> caseloads) {
    def json = new JsonBuilder()
    json caseloads, { caseload ->
      caseLoadId caseload.id
      description caseload.description
      type caseload.type
      caseloadFunction 'DUMMY'
    }

    this.stubFor(
      get('/api/users/me/caseLoads')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody(json.toString())
        ))
  }

  void stubHealth() {
    this.stubFor(
      get('/health')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'application/json')
            .withBody('''
                {
                    "status": "UP",
                    "healthInfo": {
                        "status": "UP",
                        "version": "version not available"
                    },
                    "diskSpace": {
                        "status": "UP",
                        "total": 510923390976,
                        "free": 143828922368,
                        "threshold": 10485760
                    },
                    "db": {
                        "status": "UP",
                        "database": "HSQL Database Engine",
                        "hello": 1
                    }
                }'''.stripIndent())
        ))
  }

  void stubUncategorised() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId : 12,
                offenderNo: 'B2345XY',
                firstName : 'PENELOPE',
                lastName  : 'PITSTOP',
                status    : 'UNCATEGORISED',
              ],
              [
                bookingId : 11,
                offenderNo: 'B2345YZ',
                firstName : 'ANT',
                lastName  : 'HILLMOB',
                status    : 'AWAITING_APPROVAL',
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubRecategorise() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId     : 12,
                offenderNo    : 'B2345XY',
                firstName     : 'PENELOPE',
                lastName      : 'PITSTOP',
                category      : 'C',
                nextReviewDate: '2019-07-25'
              ],
              [
                bookingId     : 11,
                offenderNo    : 'B2345YZ',
                firstName     : 'ANT',
                lastName      : 'HILLMOB',
                category      : 'D',
                nextReviewDate: '2019-07-27'
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubRecategoriseWithCatI() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId     : 12,
                offenderNo    : 'B2345XY',
                firstName     : 'PENELOPE',
                lastName      : 'PITSTOP',
                category      : 'I',
                nextReviewDate: '2019-07-25',
              ],
              [
                bookingId     : 11,
                offenderNo    : 'B2345YZ',
                firstName     : 'ANT',
                lastName      : 'HILLMOB',
                category      : 'D',
                nextReviewDate: '2019-07-27'
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubCategorised(bookingIds = [11, 12]) {
    def response = []
    if (bookingIds.contains(10)) {
      response.add ( [
        offenderNo: 'B1234AB',
        bookingId: 10,
        firstName: 'PETER',
        lastName: 'PERFECT',
        assessmentDate: '2018-03-28',
        approvalDate: '2019-03-20',
        assessmentSeq: 7,
        categoriserFirstName: 'DICK',
        categoriserLastName: 'DASTARDLY',
        approverFirstName: 'PAT',
        approverLastName: 'PENDING',
        category: 'B'
      ])
    }
    if (bookingIds.contains(11)) {
      response.add([
        offenderNo          : 'B2345YZ',
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
        category            : 'C'
      ])
    }
    if (bookingIds.contains(12)) {
      response.add([
        offenderNo          : 'B2345XY',
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
        category            : 'C'
      ])
    }
    this.stubFor(
      post("/api/offender-assessments/category/LEI")
        .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, true))
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(response
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubUncategorisedForSupervisor() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId           : 11,
                offenderNo          : 'B2345XY',
                firstName           : 'PENELOPE',
                lastName            : 'PITSTOP',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
                categoriserFirstName: 'Roger',
                categoriserLastName : 'Rabbit',
              ],
              [
                bookingId           : 12,
                offenderNo          : 'B2345YZ',
                firstName           : 'ANT',
                lastName            : 'HILLMOB',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
                categoriserFirstName: 'Bugs',
                categoriserLastName : 'Bunny',
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubUncategorisedNoStatus(bookingId) {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId : bookingId,
                offenderNo: "ON${bookingId}",
                firstName : 'HARRY',
                lastName  : 'BONNET',
                status    : 'UNCATEGORISED',
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubSentenceData(List offenderNumbers, List bookingIds, List startDate, Boolean emptyResponse = false) {
    def index = 0

    def response = emptyResponse ? [] : offenderNumbers.collect({ no ->
      [
        offenderNo    : no,
        sentenceDetail: [bookingId        : bookingIds[index],
                         sentenceStartDate: startDate[index]],
        firstName     : "firstName-${index}",
        lastName      : "lastName-${index++}"
      ]
    })

    this.stubFor(
      post("/api/offender-sentences/bookings")
        .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, false))
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(response))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubSentenceDataError() {
    this.stubFor(
      post("/api/offender-sentences/bookings")
        .willReturn(
          aResponse()
            .withStatusMessage('A test error')
            .withStatus(500))
    )
  }

  def stubSentenceDataGetSingle(String offenderNo, String formattedReleaseDate) {
    def response = [
      [
        offenderNo    : offenderNo,
        firstName     : 'firstName',
        lastName      : 'lastName',
        sentenceDetail: [bookingId  : -45,
                         releaseDate: formattedReleaseDate]
      ],
      [
        offenderNo    : offenderNo,
        firstName     : 'firstName',
        lastName      : 'lastName',
        sentenceDetail: [bookingId  : -55,
                         releaseDate: formattedReleaseDate]
      ]
    ]

    this.stubFor(
      get("/api/offender-sentences?offenderNo=${offenderNo}")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(response))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }


  def stubGetOffenderDetailsByBookingIdList(String agency) {
    this.stubFor(
      post("/api/bookings/offenders/$agency/list")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId  : 13,
                offenderNo : 'AB123',
                agencyId   : 'LEI',
                firstName  : 'FRANK',
                lastName   : 'CLARK',
                dateOfBirth: '1970-02-17',
              ],
              [
                bookingId  : 14,
                offenderNo : 'AB321',
                agencyId   : 'LEI',
                firstName  : 'JANE',
                lastName   : 'DENT',
                dateOfBirth: '1970-02-17',
              ]]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubGetOffenderDetailsByBookingIdList(String agency, bookingId) {
    this.stubFor(
      post("/api/bookings/offenders/$agency/list")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId  : bookingId,
                offenderNo : 'B2345XY',
                agencyId   : 'LEI',
                firstName  : 'JANE',
                lastName   : 'DENT',
                dateOfBirth: '1970-02-17',
              ]]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }


  def stubGetSecurityStaffDetailsByUsernameList() {
    this.stubFor(
      post("/api/users/list")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                staffId         : 123,
                username        : 'SECURITY_USER',
                firstName       : 'Amy',
                lastName        : 'Security',
                email           : 'itaguser@syscon.net',
                activeCaseLoadId: 'LEI'
              ]]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubGetCategoriserStaffDetailsByUsernameList(UserAccount user) {
    this.stubFor(
      post("/api/users/list")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                staffId         : 123,
                username        : user.username,
                firstName       : 'Api',
                lastName        : 'User',
                email           : 'itaguser@syscon.net',
                activeCaseLoadId: 'LEI'
              ]]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubGetOffenderDetails(int bookingId, offenderNo = 'B2345YZ', youngOffender = false, indeterminateSentence = false, category = 'C', multipleSentences = false) {
    this.stubFor(
      get("/api/bookings/$bookingId?basicInfo=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(
              [
                bookingId         : bookingId,
                offenderNo        : offenderNo,
                agencyId          : 'LEI',
                firstName         : 'ANT',
                lastName          : 'HILLMOB',
                dateOfBirth       : youngOffender ? '2018-01-01' : '1970-02-17',
                categoryCode      : category,
                assignedLivingUnit:
                  [
                    description: 'C-04-02',
                    agencyName : 'Coventry',
                  ],
                profileInformation: [
                  [
                    type       : 'IMM',
                    resultValue: 'Other'
                  ],
                  [
                    type       : 'NAT',
                    resultValue: 'Latvian'
                  ]
                ],
              ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )

    def sentenceDetail = [
      bookingId                         : bookingId,
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      paroleEligibilityDate             : '2020-06-13',
      nonParoleDate                     : '2020-06-14',
      tariffDate                        : '2020-06-15',
      licenceExpiryDate                 : '2020-06-16',
      sentenceExpiryDate                : '2020-06-17',]
    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = '2019-01-01'
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.automaticReleaseDate = '2020-06-11'
    }

    this.stubFor(
      get("/api/bookings/$bookingId/sentenceDetail")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(sentenceDetail))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )

    final terms = [
      [
        bookingId              : bookingId,
        sentenceSequence       : 2,
        termSequence           : 1,
        sentenceType           : "T1",
        sentenceTypeDescription: "Std sentence",
        startDate              : "2018-12-31",
        years                  : 6,
        months                 : 3,
        lifeSentence           : indeterminateSentence]
    ]
    if (multipleSentences) {
      terms.add([
        bookingId              : bookingId,
        sentenceSequence       : 4,
        termSequence           : 1,
        consecutiveTo          : 2,
        sentenceType           : "R",
        sentenceTypeDescription: "Recall 14 days",
        startDate              : "2019-03-31",
        years                  : 4,
        months                 : 2,
        lifeSentence           : false]
      )
    }
    this.stubFor(
      get("/api/offender-sentences/booking/$bookingId/sentenceTerms?earliestOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(terms))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
    this.stubFor(
      get("/api/bookings/$bookingId/mainOffence")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId         : bookingId,
                offenceDescription: 'A Felony',
              ],
              [
                bookingId         : bookingId,
                offenceDescription: 'Another Felony',
              ]
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubOffenceHistory(offenderNo) {
    this.stubFor(
      get("/api/bookings/offenderNo/$offenderNo/offenceHistory")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId         : 12,
                offenceDescription: 'Libel',
                offenceDate       : '2019-02-21',
              ],
              [
                bookingId         : 12,
                offenceDescription: 'Slander',
                offenceDate       : '2019-02-22',
                offenceRangeDate  : '2019-02-24',
              ],
              [
                bookingId         : 12,
                offenceDescription: 'Undated offence',
              ]
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubAssessments(String offenderNo, Boolean emptyResponse = false) {
    this.stubFor(
      get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(emptyResponse ? [] :
              [
                [
                  bookingId            : -45,
                  offenderNo           : offenderNo,
                  classificationCode   : 'A',
                  classification       : 'Cat A',
                  assessmentCode       : 'CATEGORY',
                  assessmentDescription: 'Categorisation',
                  cellSharingAlertFlag : false,
                  assessmentDate       : '2012-04-04',
                  nextReviewDate       : '2012-06-07',
                  approvalDate         : '2012-06-08',
                  assessmentAgencyId   : "LPI"
                ],
                [
                  bookingId            : -45,
                  offenderNo           : offenderNo,
                  classificationCode   : 'B',
                  classification       : 'Cat B',
                  assessmentCode       : 'CATEGORY',
                  assessmentDescription: 'Categorisation',
                  cellSharingAlertFlag : false,
                  assessmentDate       : '2013-03-24',
                  nextReviewDate       : '2013-09-17',
                  approvalDate         : '2012-06-08',
                  assessmentAgencyId   : "LPI"
                ]
              ])
            )
            .withHeader('Content-Type', 'application/json')
            .withStatus(200)))
  }

  def stubCategorise(String expectedCat, String nextReviewDate = '') {

    def expectedBody = [category: expectedCat]
    if (nextReviewDate) {
      expectedBody.nextReviewDate = nextReviewDate
    }

    this.stubFor(
      post("/api/offender-assessments/category/categorise")
        .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
        .willReturn(
          aResponse()
            .withHeader('Content-Type', 'application/json')
            .withStatus(201))
    )
  }

  def stubCategoriseError() {

    this.stubFor(
      post("/api/offender-assessments/category/categorise")
        .willReturn(
          aResponse()
            .withStatus(500)
        )
    )
  }

  def stubSupervisorApprove(String expectedCat) {

    this.stubFor(
      put("/api/offender-assessments/category/approve")
        .withRequestBody(equalToJson(JsonOutput.toJson([category: expectedCat]), true, true))
        .willReturn(
          aResponse()
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubAgencyDetails(agency) {

    this.stubFor(
      get("/api/agencies/$agency")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([

              agencyId   : "MDI",
              description: "Moorland (HMP & YOI)",
              agencyType : "INST"

            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }
}
