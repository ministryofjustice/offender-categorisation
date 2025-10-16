import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { makeTestViperDto } from "../../server/data/formApi/viper/viper.dto.test-factory";

export default {
  stubSubmitSecurityReview: ({ bookingId }: { bookingId: number }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        url: `/offender-categorisation-api/security/review/${bookingId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: true,
      },
    }),
  stubGetViperData: ({ prisonerNumber, aboveThreshold }: { prisonerNumber: string, aboveThreshold: boolean }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/risk/viper/${prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: makeTestViperDto({
          aboveThreshold
        }),
      },
    }),
}
