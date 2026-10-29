import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'
import setUpCurrentUser from './setUpCurrentUser'
import { addUserMetadataToRequestSpan, captureRequestSpan } from './userTelemetry'

const uuid = '11111111-1111-1111-1111-111111111111'
const request = {} as Request

function createResponse(token: string): Response {
  return {
    locals: {
      user: { username: 'USER', token, authSource: 'nomis' },
    },
  } as unknown as Response
}

function createToken(payload: Record<string, string> = {}): string {
  return jwt.sign(payload, 'secret')
}

function createActiveSpan(): NonNullable<ReturnType<typeof trace.getActiveSpan>> {
  return {
    spanContext: () => ({ traceId: '00000000000000000000000000000000', spanId: '0000000000000000', traceFlags: 1 }),
    setAttribute() {
      return this
    },
    setAttributes() {
      return this
    },
    addEvent() {
      return this
    },
    addLink() {
      return this
    },
    addLinks() {
      return this
    },
    setStatus() {
      return this
    },
    updateName() {
      return this
    },
    end: () => undefined,
    isRecording: () => true,
    recordException: () => undefined,
  }
}

describe('setUpCurrentUser', () => {
  let setAttribute: jest.SpyInstance

  beforeEach(() => {
    const activeSpan = createActiveSpan()
    setAttribute = jest.spyOn(activeSpan, 'setAttribute')
    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(activeSpan)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('adds the HMPPS Auth user UUID to App Insights telemetry', () => {
    const res = createResponse(createToken({ user_uuid: uuid }))
    const next = jest.fn()

    setUpCurrentUser()(request, res, next)

    expect(res.locals.user.userUuid).toBe(uuid)
    expect(next).toHaveBeenCalled()

    captureRequestSpan()(request, res, next)
    // the active span is lost after the session store, but the captured span is still used
    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(undefined)
    addUserMetadataToRequestSpan()(request, res, next)

    expect(setAttribute).toHaveBeenCalledWith('userUuid', uuid)
  })

  it('continues when the token does not contain a user UUID and omits the telemetry attribute', () => {
    const res = createResponse(createToken())
    const next = jest.fn()

    setUpCurrentUser()(request, res, next)

    expect(res.locals.user.userUuid).toBeUndefined()
    expect(next).toHaveBeenCalled()

    captureRequestSpan()(request, res, next)
    addUserMetadataToRequestSpan()(request, res, next)

    expect(setAttribute).not.toHaveBeenCalled()
  })
})
