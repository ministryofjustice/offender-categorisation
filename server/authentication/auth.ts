import passport from 'passport'
import { Strategy } from 'passport-oauth2'

import { config } from '../config'
import clientCredentials from './clientCredentials'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

const authenticationMiddleware = () => {
  return async (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/login')
  }
}

function init(): void {
  const useNew = config.featureFlags.auth.useNewAuth
  const clientId = useNew ? config.apis.oauth2.authCodeClientId : config.apis.oauth2.apiClientId
  const clientSecret = useNew ? config.apis.oauth2.authCodeClientSecret : config.apis.oauth2.apiClientSecret

  const strategy = new Strategy(
    {
      authorizationURL: `${config.apis.oauth2.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.oauth2.url}/oauth/token`,
      clientID: clientId,
      clientSecret,
      callbackURL: `${config.domain}/login/callback`,
      state: true,
      customHeaders: { Authorization: clientCredentials.generateOauthClientToken() },
    },
    (token, refreshToken, params, profile, done) => {
      return done(null, { token, username: params.user_name, authSource: params.auth_source })
    },
  )

  passport.use(strategy)
}

export default {
  authenticationMiddleware,
  init,
}
