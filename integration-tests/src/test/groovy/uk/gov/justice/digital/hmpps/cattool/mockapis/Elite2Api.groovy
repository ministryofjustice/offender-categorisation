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
      get('/ping')
        .willReturn(
          aResponse()
            .withStatus(200)
            .withHeader('Content-Type', 'text/plain')
            .withBody("pong")))
  }

  void stubUncategorised() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId    : 12,
                offenderNo   : 'B2345XY',
                firstName    : 'PENELOPE',
                lastName     : 'PITSTOP',
                status       : 'UNCATEGORISED',
                assessmentSeq: 5,
              ],
              [
                bookingId    : 11,
                offenderNo   : 'B2345YZ',
                firstName    : 'ANT',
                lastName     : 'HILLMOB',
                status       : 'AWAITING_APPROVAL',
                assessmentSeq: 4,
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubUncategorisedFull() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId           : 31,
                offenderNo          : 'B0031AA',
                firstName           : 'AWAITING',
                lastName            : 'MISSING',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
              ],
              [
                bookingId           : 32,
                offenderNo          : 'B0032AA',
                firstName           : 'AWAITING',
                lastName            : 'STARTED',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
              ],
              [
                bookingId           : 33,
                offenderNo          : 'B0033AA',
                firstName           : 'AWAITING',
                lastName            : 'AWAITING',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
              ],
              [
                bookingId           : 34,
                offenderNo          : 'B0034AA',
                firstName           : 'AWAITING',
                lastName            : 'APPROVED',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
              ],
              [
                bookingId           : 35,
                offenderNo          : 'B0035AA',
                firstName           : 'UNCATEGORISED',
                lastName            : 'MISSING',
                status              : 'UNCATEGORISED',
                category            : 'B',
              ],
              [
                bookingId           : 36,
                offenderNo          : 'B0036AA',
                firstName           : 'UNCATEGORISED',
                lastName            : 'STARTED',
                status              : 'UNCATEGORISED',
                category            : 'C',
              ],
              [
                bookingId           : 37,
                offenderNo          : 'B0037AA',
                firstName           : 'UNCATEGORISED',
                lastName            : 'AWAITING',
                status              : 'UNCATEGORISED',
                category            : 'B',
              ],
              [
                bookingId           : 38,
                offenderNo          : 'B0038AA',
                firstName           : 'UNCATEGORISED',
                lastName            : 'APPROVED',
                status              : 'UNCATEGORISED',
                category            : 'C',
              ],
              [
                bookingId           : 39,
                offenderNo          : 'B0039AA',
                firstName           : 'AWAITING',
                lastName            : 'SUPERVISOR_BACK',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubRecategorise(assessStatusList=['A','A','A','A']) {
    def today = LocalDate.now()
    final date = today.plusMonths(2)
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS&date=$date")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId     : 12,
                offenderNo    : 'B2345XY',
                firstName     : 'PENELOPE',
                lastName      : 'PITSTOP',
                category      : 'C',
                nextReviewDate: today.minusDays(4).format('yyyy-MM-dd'),
                assessStatus: assessStatusList[0]
              ],
              [
                bookingId     : 11,
                offenderNo    : 'B2345YZ',
                firstName     : 'ANT',
                lastName      : 'HILLMOB',
                category      : 'D',
                nextReviewDate: today.minusDays(2).format('yyyy-MM-dd'),
                assessStatus: assessStatusList[1]
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )

    final fromDob = today.minusYears(22)
    final toDob = today.minusYears(21).plusMonths(2)
    this.stubFor(
      get("/api/locations/description/LEI/inmates?fromDob=$fromDob&toDob=$toDob&returnCategory=true")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId   : 21,
                offenderNo  : 'C0001AA',
                firstName   : 'TINY',
                lastName    : 'TIM',
                dateOfBirth : today.minusYears(21).minusDays(3).format('yyyy-MM-dd'),
                age         : 20,
                categoryCode: 'I',
              ],
              [
                bookingId   : 22,
                offenderNo  : 'C0002AA',
                firstName   : 'ADRIAN',
                lastName    : 'MOLE',
                dateOfBirth : today.minusYears(21).plusDays(17).format('yyyy-MM-dd'),
                age         : 20,
                categoryCode: 'I',
              ],]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )

    this.stubFor(
      post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId         : 21,
                offenderNo        : 'C0001AA',
                classificationCode: 'C',
                nextReviewDate    : today.minusDays(4).format('yyyy-MM-dd'),
                assessmentStatus  : assessStatusList[2]
              ],
              [
                bookingId         : 22,
                offenderNo        : 'C0002AA',
                classificationCode: 'D',
                nextReviewDate    : today.minusDays(2).format('yyyy-MM-dd'),
                assessmentStatus  : assessStatusList[3]
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubRecategoriseWithCatI() {
    final date = LocalDate.now().plusMonths(2)
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=RECATEGORISATIONS&date=$date")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId     : 12,
                offenderNo    : 'B2345XY',
                firstName     : 'PENELOPE',
                lastName      : 'PITSTOP',
                category      : 'B',
                nextReviewDate: '2019-07-25',
              ],
              [
                bookingId     : 11,
                offenderNo    : 'B2345YZ',
                firstName     : 'ANT',
                lastName      : 'HILLMOB',
                category      : 'C',
                nextReviewDate: '2019-07-27'
              ],
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
    final fromDob = LocalDate.now().minusYears(22)
    final toDob = LocalDate.now().minusYears(21).plusMonths(2)
    this.stubFor(
      get("/api/locations/description/LEI/inmates?fromDob=$fromDob&toDob=$toDob&returnCategory=true")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId   : 21,
                offenderNo  : 'C0001AA',
                firstName   : 'TINY',
                lastName    : 'TIM',
                dateOfBirth : '1998-07-24',
                age         : 20,
                categoryCode: 'I',
              ],
              [
                bookingId   : 22,
                offenderNo  : 'C0002AA',
                firstName   : 'ADRIAN',
                lastName    : 'MOLE',
                dateOfBirth : '1998-08-15',
                age         : 20,
                categoryCode: 'I',
              ],]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )

    this.stubFor(
      post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson([
          [
            bookingId     : 21,
            offenderNo    : 'C0001AA',
            classificationCode      : 'C',
            nextReviewDate: '2019-07-25',
            assessmentStatus: 'A'
          ],
          [
            bookingId     : 22,
            offenderNo    : 'C0002AA',
            classificationCode      : 'D',
            nextReviewDate: '2019-07-27',
            assessmentStatus  : 'A'
          ],
        ]
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  void stubGetLatestCategorisationForOffenders(){
    this.stubFor(
      post("/api/offender-assessments/CATEGORY?latestOnly=true&activeOnly=false")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson([
          [
            bookingId     : 12,
            offenderNo    : 'B2345XY',
            classificationCode      : 'C',
            nextReviewDate: '2019-07-25',
            assessmentStatus: 'A'
          ]
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
      post("/api/offender-assessments/category?latestOnly=false")
        .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, true))
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(response
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubCategorisedMultiple(bookingIds = [11, 12]) {
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
        approvalDate        : '2019-02-28',
        assessmentSeq       : 7,
        categoriserFirstName: 'JANE',
        categoriserLastName : 'FAN',
        approverFirstName   : 'JAMES',
        approverLastName    : 'HELLY',
        category            : 'C'
      ])
      response.add([
        offenderNo          : 'B2345YZ',
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
      response.add([
        offenderNo          : 'B2345XY',
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
        category            : 'C'
      ])
    }
    this.stubFor(
      post("/api/offender-assessments/category?latestOnly=false")
        .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, true))
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson(response
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  void stubUncategorisedAwaitingApproval() {
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
                categoriserFirstName: 'ROGER',
                categoriserLastName : 'RABBIT',
                assessmentSeq       : 4,
              ],
              [
                bookingId           : 12,
                offenderNo          : 'B2345YZ',
                firstName           : 'ANT',
                lastName            : 'HILLMOB',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
                categoriserFirstName: 'BUGS',
                categoriserLastName : 'BUNNY',
                assessmentSeq       : 5,
              ],
            ]))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  void stubUncategorisedForSupervisorFull() {
    this.stubFor(
      get("/api/offender-assessments/category/LEI?type=UNCATEGORISED")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId           : 31,
                offenderNo          : 'B0031AA',
                firstName           : 'AWAITING',
                lastName            : 'MISSING',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
                categoriserFirstName: 'ROGER',
                categoriserLastName : 'RABBIT',
                nextReviewDate      : '2019-01-15',
              ],
              [
                bookingId           : 32,
                offenderNo          : 'B0032AA',
                firstName           : 'AWAITING',
                lastName            : 'STARTED',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
                categoriserFirstName: 'BUGS',
                categoriserLastName : 'BUNNY',
                nextReviewDate      : '2019-01-16',
              ],
              [
                bookingId           : 33,
                offenderNo          : 'B0033AA',
                firstName           : 'AWAITING',
                lastName            : 'AWAITING',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
                categoriserFirstName: 'ROGER',
                categoriserLastName : 'RABBIT',
                nextReviewDate      : '2019-01-17',
                assessmentSeq       : 3,
              ],
              [
                bookingId           : 34,
                offenderNo          : 'B0034AA',
                firstName           : 'AWAITING',
                lastName            : 'APPROVED',
                status              : 'AWAITING_APPROVAL',
                category            : 'C',
                categoriserFirstName: 'BUGS',
                categoriserLastName : 'BUNNY',
                nextReviewDate      : '2019-01-18',
              ],
              [
                bookingId           : 35,
                offenderNo          : 'B0035AA',
                firstName           : 'AWAITING',
                lastName            : 'MISSING',
                status              : 'UNCATEGORISED',
                category            : 'B',
                categoriserFirstName: 'ROGER',
                categoriserLastName : 'RABBIT',
                nextReviewDate      : '2019-01-19',

              ],
              [
                bookingId           : 36,
                offenderNo          : 'B0036AA',
                firstName           : 'MR',
                lastName            : 'RECAT',
                status              : 'AWAITING_APPROVAL',
                category            : 'B',
                categoriserFirstName: 'ROGER',
                categoriserLastName : 'RABBIT',
                nextReviewDate      : '2019-02-01',
                assessmentSeq       : 6,
              ],
            ]))
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

    def offences = emptyResponse ? [] : bookingIds.collect({ no ->
      [
        bookingId  : no,
        offenceCode: "OFF${no}",
        statuteCode : "ST${no}"
      ]
    })

    this.stubFor(
      post("/api/bookings/mainOffence")
        .withRequestBody(equalToJson(JsonOutput.toJson(bookingIds), true, false))
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(offences))
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
        bookingId     : -45,
        firstName     : 'firstName',
        lastName      : 'lastName',
        sentenceDetail: [bookingId: -45, releaseDate: formattedReleaseDate]
      ],
      [
        offenderNo    : offenderNo,
        bookingId     : -55,
        firstName     : 'firstName',
        lastName      : 'lastName',
        sentenceDetail: [bookingId: -55, releaseDate: formattedReleaseDate]
      ],
      [
        offenderNo    : offenderNo,
        bookingId     : 12,
        firstName     : 'firstName12',
        lastName      : 'lastName12',
        sentenceDetail: [bookingId: 12, releaseDate: '2020-11-30']
      ],
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


  def stubGetOffenderDetailsByOffenderNoList(List offenderNumbers) {
    this.stubFor(
      post("/api/bookings/offenders?activeOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId  : 13,
                offenderNo : offenderNumbers[0],
                agencyId   : 'LEI',
                firstName  : 'FRANK',
                lastName   : 'CLARK',
                dateOfBirth: '1970-02-17',
              ],
              [
                bookingId  : 14,
                offenderNo : offenderNumbers[1],
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

  def stubGetOffenderDetailsByOffenderNoList(bookingId, offenderNo) {
    this.stubFor(
      post("/api/bookings/offenders?activeOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              [
                bookingId  : bookingId,
                offenderNo : offenderNo,
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
                category          : 'Cat ' + category,
                categoryCode      : category,
                assessments       : [
                  [
                    assessmentCode: 'CATEGORY',
                    nextReviewDate: '2020-01-16',
                  ],
                ],
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
      sentenceStartDate                 : '2019-08-15',
      homeDetentionCurfewEligibilityDate: '2020-06-10',
      paroleEligibilityDate             : '2020-06-13',
      nonParoleDate                     : '2020-06-14',
      tariffDate                        : '2020-06-15',
      licenceExpiryDate                 : '2020-06-16',
      sentenceExpiryDate                : '2020-06-17',]
    if (!indeterminateSentence) {
      sentenceDetail.releaseDate = '2019-01-01'
      sentenceDetail.conditionalReleaseDate = '2020-02-02'
      sentenceDetail.confirmedReleaseDate = LocalDate.now().plusYears(4).format('yyyy-MM-dd') // > 3
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

  def stubGetBasicOffenderDetails(int bookingId, offenderNo = 'B2345YZ') {
    this.stubFor(
      get("/api/bookings/$bookingId?basicInfo=true")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(
              [
                bookingId  : bookingId,
                offenderNo : offenderNo,
                agencyId   : 'LEI',
                firstName  : 'ANT',
                lastName   : 'HILLMOB',
                dateOfBirth: '1970-02-17',
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
      get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false")
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
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'A'
                ],
                [
                  bookingId            : -45,
                  offenderNo           : offenderNo,
                  classificationCode   : 'A',
                  classification       : 'Cat A',
                  assessmentCode       : 'CATEGORY',
                  assessmentDescription: 'Categorisation',
                  cellSharingAlertFlag : false,
                  assessmentDate       : '2012-03-28',
                  nextReviewDate       : '2012-06-07',
                  approvalDate         : '2012-06-18',
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'P'
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
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'I'
                ]
              ])
            )
            .withHeader('Content-Type', 'application/json')
            .withStatus(200)))
  }

  def stubAssessmentsWithCurrent(String offenderNo) {
    this.stubFor(
      get("/api/offender-assessments/CATEGORY?offenderNo=${offenderNo}&latestOnly=false&activeOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson(
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
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'A'
                ],
                [
                  bookingId            : -45,
                  offenderNo           : offenderNo,
                  classificationCode   : 'A',
                  classification       : 'Cat A',
                  assessmentCode       : 'CATEGORY',
                  assessmentDescription: 'Categorisation',
                  cellSharingAlertFlag : false,
                  assessmentDate       : '2012-03-28',
                  nextReviewDate       : '2012-06-07',
                  approvalDate         : '2012-06-18',
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'P'
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
                  assessmentAgencyId   : "LPI",
                  assessmentStatus     : 'I'
                ],
                [
                  bookingId            : 12,
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
                  assessmentStatus     : 'I'
                ],
                [
                  bookingId            : 12,
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
                  assessmentStatus     : 'A'
                ],
              ])
            )
            .withHeader('Content-Type', 'application/json')
            .withStatus(200)))
  }

  def stubCategorise(String expectedCat, String nextReviewDate = '', long bookingId = 12, sequenceNumber = 4) {

    def expectedBody = [bookingId: bookingId, category: expectedCat, committee: 'OCA']
    if (nextReviewDate) {
      expectedBody.nextReviewDate = nextReviewDate
    }

    this.stubFor(
      post("/api/offender-assessments/category/categorise")
        .withRequestBody(equalToJson(JsonOutput.toJson(expectedBody), true, true))
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              bookingId         : bookingId,
              sequenceNumber    : sequenceNumber
            ]))
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
        .withRequestBody(equalToJson(JsonOutput.toJson([
          category: expectedCat, reviewCommitteeCode: 'OCA'
        ]), true, true))
        .willReturn(
          aResponse()
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubUpdateNextReviewDate() {

    this.stubFor(
      put(urlMatching("/api/offender-assessments/category/12/nextReviewDate/.*"))
        .willReturn(
        aResponse()
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  def stubSetInactive(bookingId, status) {

    this.stubFor(
      put("/api/offender-assessments/category/${bookingId}/inactive?status=${status}")
        .willReturn(
          aResponse()
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def verifySetInactive() {
    verify(putRequestedFor(urlMatching("/api/offender-assessments/category/12/inactive\\?status=\\w+")))
  }

  def stubAgencyDetails(agency) {

    this.stubFor(
      get("/api/agencies/$agency?activeOnly=false")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              agencyId   : agency,
              description: "$agency prison",
              agencyType : "INST"
            ]))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }

  def stubGetCategory(bookingId, cat) {

    this.stubFor(
      get("/api/bookings/${bookingId}/assessment/CATEGORY")
        .willReturn(
          aResponse()
            .withBody(JsonOutput.toJson([
              classificationCode   : cat,
            ]
            ))
            .withHeader('Content-Type', 'application/json')
            .withStatus(200))
    )
  }
}
