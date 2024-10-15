import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubMatchPrisoners: (prisonerNumbers: string[] = []): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: `nomsNumbers`,
        bodyPatterns: [
          {
            equalToJson: JSON.stringify({ prisonerNumbers }),
            ignoreArrayOrder: true,
            ignoreExtraElements: true,
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: [],
      },
    }),
}
