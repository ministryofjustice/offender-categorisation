import type { NextFunction, Request, Response } from 'express'
import log from '../../log'

export const bookingExistsAtCurrentEstablishmentMiddleware =
  (userService, offendersService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { bookingId } = req.params
    if (typeof bookingId === 'undefined') {
      const error = new Error('bookingExistsAtCurrentEstablishmentMiddleware: No booking id in params')
      log.error(error.message)
      next(error)
      return
    }
    const user = await userService.getUser(res.locals)
    res.locals.user = { ...user, ...res.locals?.user }
    const basicOffenderDetails = await offendersService.getBasicOffenderDetails(res.locals, bookingId)
    res.locals.basicOffenderDetails = basicOffenderDetails
    if (user?.activeCaseLoad?.caseLoadId !== basicOffenderDetails?.agencyId) {
      const error = new Error(
        `bookingExistsAtCurrentEstablishmentMiddleware: booking agency ID does not match to the active caseload`
      )
      log.error(error.message)
      next(error)
      return
    }

    next()
  }

export default bookingExistsAtCurrentEstablishmentMiddleware
