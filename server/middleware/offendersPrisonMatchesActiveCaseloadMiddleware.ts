import type { Request, Response, NextFunction } from 'express'

export const offendersPrisonMatchesActiveCaseloadMiddleware =
  (offenderService, userService) => async (req: Request, res: Response, next: NextFunction) => {
    const { bookingId } = req.params
    const details = await offenderService.getOffenderDetails(res.locals, bookingId)
    const user = await userService.getUser(res.locals)
    if (user.activeCaseLoadId !== details.agencyId) {
      throw new Error('Offender agency ID does not match the currently active caseload ID')
    }
    next()
  }

export default offendersPrisonMatchesActiveCaseloadMiddleware
