import asyncMiddlewareInDatabaseTransaction from './asyncMiddlewareInDatabaseTransaction'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const db = require('../data/dataAccess/db')

jest.mock('../data/dataAccess/db', () => ({
  doTransactional: jest.fn(),
}))

describe('asyncMiddlewareInDatabaseTransaction', () => {
  const req = {}
  const res = {}
  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes transactional client to handler', async () => {
    const client = {}

    ;(db.doTransactional as jest.Mock).mockImplementation(callback => callback(client))

    const handler = jest.fn()

    asyncMiddlewareInDatabaseTransaction(handler)(req, res, next)

    await new Promise(process.nextTick)

    expect(db.doTransactional).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith(req, res, client)
  })

  it('passes errors to next', async () => {
    const error = new Error('boom')

    ;(db.doTransactional as jest.Mock).mockImplementation(callback => callback({}))

    const handler = jest.fn().mockRejectedValue(error)

    asyncMiddlewareInDatabaseTransaction(handler)(req, res, next)

    await new Promise(process.nextTick)

    expect(next).toHaveBeenCalledWith(error)
  })
})
