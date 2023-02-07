package uk.gov.justice.digital.hmpps.cattool.mockapis

import com.github.tomakehurst.wiremock.junit.WireMockRule
import groovy.json.JsonOutput

import java.time.LocalDate

import static com.github.tomakehurst.wiremock.client.WireMock.*

class PrisonerSearchApi extends WireMockRule {

  PrisonerSearchApi() {
    super(8084)
  }

  final def elasticSearchData = JsonOutput.toJson([
      [
          prisonerNumber                    : "A1234AA",
          pncNumber                         : "12/394773H",
          pncNumberCanonicalShort           : "12/394773H",
          pncNumberCanonicalLong            : "2012/394773H",
          croNumber                         : "29906/12J",
          bookingId                         : '1200924',
          bookNumber                        : "38412A",
          firstName                         : "Robert",
          middleNames                       : "John James",
          lastName                          : "Larsen",
          dateOfBirth                       : "1975-04-02",
          gender                            : "Female",
          ethnicity                         : "White: Eng./Welsh/Scot./N.Irish/British",
          youthOffender                     : true,
          maritalStatus                     : "Widowed",
          religion                          : "Church of England (Anglican)",
          nationality                       : "Egyptian",
          status                            : "ACTIVE IN",
          lastMovementTypeCode              : "CRT",
          lastMovementReasonCode            : "CA",
          inOutStatus                       : "IN",
          prisonId                          : "MDI",
          prisonName                        : "HMP Leeds",
          cellLocation                      : "A-1-002",
          aliases                           : [
              [
                  firstName  : "Robert",
                  middleNames: "Trevor",
                  lastName   : "Lorsen",
                  dateOfBirth: "1975-04-02",
                  gender     : "Male",
                  ethnicity  : "White : Irish"
              ]
          ],
          alerts                            : [
              [
                  alertType: "H",
                  alertCode: "HA",
                  active   : true,
                  expired  : true
              ]
          ],
          csra                              : "HIGH",
          category                          : "C",
          legalStatus                       : "SENTENCED",
          imprisonmentStatus                : "LIFE",
          imprisonmentStatusDescription     : "Serving Life Imprisonment",
          mostSeriousOffence                : "Robbery",
          recall                            : false,
          indeterminateSentence             : true,
          sentenceStartDate                 : "2020-04-03",
          releaseDate                       : "2023-05-02",
          confirmedReleaseDate              : "2023-05-01",
          sentenceExpiryDate                : "2023-05-01",
          licenceExpiryDate                 : "2023-05-01",
          homeDetentionCurfewEligibilityDate: "2023-05-01",
          homeDetentionCurfewActualDate     : "2023-05-01",
          homeDetentionCurfewEndDate        : "2023-05-02",
          topupSupervisionStartDate         : "2023-04-29",
          topupSupervisionExpiryDate        : "2023-05-01",
          additionalDaysAwarded             : 10,
          nonDtoReleaseDate                 : "2023-05-01",
          nonDtoReleaseDateType             : "ARD",
          receptionDate                     : "2023-05-01",
          paroleEligibilityDate             : "2023-05-01",
          automaticReleaseDate              : "2023-05-01",
          postRecallReleaseDate             : "2023-05-01",
          conditionalReleaseDate            : "2023-05-01",
          actualParoleDate                  : "2023-05-01",
          tariffDate                        : "2023-05-01",
          locationDescription               : "Outside - released from Leeds",
          restrictedPatient                 : true,
          supportingPrisonId                : "LEI",
          dischargedHospitalId              : "HAZLWD",
          dischargedHospitalDescription     : "Hazelwood House",
          dischargeDate                     : "2020-05-01",
          dischargeDetails                  : "Psychiatric Hospital Discharge to Hazelwood House",
          currentIncentive                  : [
              level         : [
                  description: "Standard"
              ],
              dateTime      : "2021-07-05T10:35:17",
              nextReviewDate: "2022-11-10"
          ]
      ]
  ])

  void stubGetPrisonerSearchPrisoners(List dateOfBirths = [], String agencyId= 'LEI') {
//    final agencyId = 'LEI'
    final today = LocalDate.now()
    final fromDob = today.minusYears(22)
    final toDob = today.minusYears(21).plusMonths(2)
    this.stubFor(
        get("/prison/${agencyId}/prisoners?size=1000000&fromDob=$fromDob&toDob=$toDob")
            .willReturn(
                aResponse()
                    .withBody(JsonOutput.toJson([content: [
                        [
                            bookingId     : '21',
                            prisonerNumber: 'C0001AA',
                            firstName     : 'TINY',
                            lastName      : 'TIM',
                            dateOfBirth   : dateOfBirths[0] ?: today.minusDays(3).minusYears(21).format('yyyy-MM-dd'),
                            category      : 'I',
                        ],
                        [
                            bookingId     : '22',
                            prisonerNumber: 'C0002AA',
                            firstName     : 'ADRIAN',
                            lastName      : 'MOLE',
                            // beware leap-years, when today + 17 days - 21 years DIFFERS from today - 21 years + 17 days (by one day!)
                            dateOfBirth   : dateOfBirths[1] ?: today.plusDays(17).minusYears(21).format('yyyy-MM-dd'),
                            category      : 'I',
                        ]
                    ]
                    ]
                    ))
                    .withHeader('Content-Type', 'application/json')
                    .withStatus(200))
    )
  }

  void stubGetPrisonerSearchBookingIds(ArrayList<Integer> bookingIds) {
    this.stubFor(
        post("/prisoner-search/booking-ids")
            .withRequestBody(equalToJson(JsonOutput.toJson([bookingIds: bookingIds]), true, true))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader('Content-Type', 'application/json')
                    .withBody(elasticSearchData)
            )
    )
  }

  def stubSentenceData(List offenderNumbers, List bookingIds, List startDate, Boolean emptyResponse = false) {
    def index = 0

    def response = emptyResponse ? [] : offenderNumbers.collect({ no ->
      [
          prisonerNumber    : no, // offenderNo
          bookingId         : bookingIds[index].toString(),
          sentenceStartDate : startDate[index],
          releaseDate       : LocalDate.now().toString(),
          firstName         : "firstName-${index}",
          lastName          : "lastName-${index++}",
          offenceCode       : "OFF${no}",
          statuteCode       : "ST${no}",
          mostSeriousOffence: 'Robbery'
      ]
    })

    this.stubFor(
        post("/prisoner-search/booking-ids")
            .withRequestBody(equalToJson(JsonOutput.toJson([bookingIds: bookingIds]), true, false))
            .willReturn(
                aResponse()
                    .withBody(JsonOutput.toJson(response))
                    .withHeader('Content-Type', 'application/json')
                    .withStatus(200))
    )
  }

  def stubSentenceDataError() {
    this.stubFor(
        post("/prisoner-search/booking-ids")
            .willReturn(
                aResponse()
                    .withStatusMessage('A test error')
                    .withStatus(500))
    )
  }

  void stubHealth() {
    this.stubFor(
        get('/health/ping')
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader('Content-Type', 'text/plain')
                    .withBody("Everything is fine.")))
  }
}
