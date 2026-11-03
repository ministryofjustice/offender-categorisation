import type { RequestHandler } from 'express'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwtDecode = require('jwt-decode')

export default function setUpCurrentUser(): RequestHandler {
  return (_req, res, next) => {
    const { user } = res.locals
    if (user?.token) {
      const { user_uuid: userUuid } = jwtDecode(user.token)
      user.userUuid = userUuid
    }

    next()
  }
}
