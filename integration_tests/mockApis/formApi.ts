import { SuperAgentRequest } from "superagent";
import { stubFor } from "./wiremock";

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
      }
    })
}
