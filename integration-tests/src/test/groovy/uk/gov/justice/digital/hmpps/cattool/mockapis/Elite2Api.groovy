package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonBuilder
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import uk.gov.justice.digital.hmpps.cattool.mockapis.mockResponses.*
import uk.gov.justice.digital.hmpps.cattool.model.Caseload
import uk.gov.justice.digital.hmpps.cattool.model.UserAccount

import java.time.format.DateTimeFormatter

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
      get("/api/offender-assessments/category/LEI/uncategorised")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson([
          [
            "bookingId" : 11,
            "offenderNo": "B2345XY",
            firstName   : 'PENELOPE',
            lastName    : 'PITSTOP',
            status      : 'UNCATEGORISED',
          ],
          [
            "bookingId" : 12,
            "offenderNo": "B2345YZ",
            firstName   : 'ANT',
            lastName    : 'HILLMOB',
            status      : 'AWAITING_APPROVAL',
          ],
        ]
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  void stubUncategorisedNoStatus(bookingId) {
    this.stubFor(
      get("/api/offender-assessments/category/LEI/uncategorised")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson([
          [
            "bookingId" : bookingId,
            "offenderNo": "ON${bookingId}",
            firstName   : 'HARRY',
            lastName    : 'BONNET',
          ],
        ]
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  def stubSentenceData(List offenderNumbers, List bookingIds, String formattedStartDate, Boolean emptyResponse = false) {
    def index = 0

    def response = emptyResponse ? [] : offenderNumbers.collect({ no ->
      [
        "offenderNo"    : no,
        "firstName"     : "firstName-${index}",
        "lastName"      : "lastName-${index}",
        "sentenceDetail": [bookingId        : bookingIds[index++],
                           sentenceStartDate: formattedStartDate]
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

  def stubSentenceDataGetSingle(String offenderNo, String formattedReleaseDate) {
    def response = [
      [
        "offenderNo"    : offenderNo,
        "firstName"     : "firstName",
        "lastName"      : "lastName",
        "sentenceDetail": [bookingId  : -45,
                           releaseDate: formattedReleaseDate]
      ],
      [
        "offenderNo"    : offenderNo,
        "firstName"     : "firstName",
        "lastName"      : "lastName",
        "sentenceDetail": [bookingId  : -55,
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


  def stubGetOffenderDetails(int bookingId, offenderNo="B2345YZ") {
    this.stubFor(
      get("/api/bookings/$bookingId?basicInfo=false")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson(
          [
            bookingId         : bookingId,
            offenderNo        : offenderNo,
            firstName         : 'ANT',
            lastName          : 'HILLMOB',
            dateOfBirth       : "1970-02-17",
            assignedLivingUnit:
              [
                description: "C-04-02",
                agencyName : "Coventry",
              ],
            profileInformation: [
              [
                type       : "IMM",
                resultValue: "Other"
              ],
              [
                type       : "NAT",
                resultValue: "Latvian"
              ]
            ],
          ]
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
    this.stubFor(
      get("/api/bookings/$bookingId/sentenceDetail")
        .willReturn(
        aResponse()
          .withBody(JsonOutput.toJson(
          [
            bookingId                         : bookingId,
            releaseDate                       : "2019-01-01",
            homeDetentionCurfewEligibilityDate: '2020-06-10',
            automaticReleaseDate              : '2020-06-11',
            conditionalReleaseDate            : "2020-02-02",
            paroleEligibilityDate             : '2020-06-13',
            nonParoleDate                     : '2020-06-14',
            tariffDate                        : '2020-06-15',
            licenceExpiryDate                 : '2020-06-16',
            sentenceExpiryDate                : '2020-06-17',]
        ))
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
            offenceDescription: "A Felony",
          ],
          [
            bookingId         : bookingId,
            offenceDescription: "Another Felony",
          ]
        ]
        ))
          .withHeader('Content-Type', 'application/json')
          .withStatus(200))
    )
  }

  def stubAlerts(List offenderNumbers, Boolean emptyResponse = false) {
    this.stubFor(
      post("/api/bookings/offenderNo/LEI/alerts")
        .withRequestBody(equalToJson(JsonOutput.toJson(offenderNumbers), true, false))
        .willReturn(
        aResponse()
          .withBody(emptyResponse ? JsonOutput.toJson([]) : HouseblockResponse.alertsResponse)
          .withHeader('Content-Type', 'application/json')
          .withStatus(200)))
  }

  def stubSystemAccessAlerts(List offenderNumbers, Boolean emptyResponse = false) {
    this.stubFor(
      post("/api/bookings/offenderNo/alerts")
        .withRequestBody(equalToJson(JsonOutput.toJson(offenderNumbers), true, false))
        .willReturn(
        aResponse()
          .withBody(emptyResponse ? JsonOutput.toJson([]) : HouseblockResponse.alertsResponse)
          .withHeader('Content-Type', 'application/json')
          .withStatus(200)))
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
              classificationCode   : "A",
              classification       : "Cat A",
              assessmentCode       : "CATEGORY",
              assessmentDescription: "Categorisation",
              cellSharingAlertFlag : false,
              assessmentDate       : "2012-04-04",
              nextReviewDate       : "2012-06-07"
            ],
            [
              bookingId            : -45,
              offenderNo           : offenderNo,
              classificationCode   : "B",
              classification       : "Cat B",
              assessmentCode       : "CATEGORY",
              assessmentDescription: "Categorisation",
              cellSharingAlertFlag : false,
              assessmentDate       : "2013-03-24",
              nextReviewDate       : "2013-09-17"
            ]
          ])
        )
          .withHeader('Content-Type', 'application/json')
          .withStatus(200)))
  }

  void stubImage() {
    this.stubFor(
      get(urlMatching("/api/bookings/offenderNo/.+/image/data"))
        .willReturn(aResponse()
        .withStatus(404)))
  }
}
