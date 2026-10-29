import type { RequestHandler } from 'express'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'

// The callback-based redis session store loses the async context, so the request span
// must be captured before the session middleware runs and used directly afterwards.
export function captureRequestSpan(): RequestHandler {
  return (_req, res, next) => {
    res.locals.span = trace.getActiveSpan()
    next()
  }
}

export function addUserMetadataToRequestSpan(): RequestHandler {
  return (_req, res, next) => {
    const { span, user } = res.locals
    if (span) {
      if (user?.userId) span.setAttribute('userId', user.userId)
      if (user?.userUuid) span.setAttribute('userUuid', user.userUuid)
    }
    next()
  }
}
