import superagent, { SuperAgentRequest, Response } from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = body => superagent.post(`${url}/requests/find`).send(body)

const clearPreviousRequests = (): SuperAgentRequest => superagent.delete(`${url}/requests`)

const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), clearPreviousRequests()])

export { stubFor, getMatchingRequests, resetStubs, clearPreviousRequests }
