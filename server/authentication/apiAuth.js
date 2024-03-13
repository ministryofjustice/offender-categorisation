const passport = require('passport')
const { ExtractJwt, Strategy } = require('passport-jwt')
const { passportJwtSecret } = require('jwks-rsa')
// const config = require('../config')

const apiAuthenticationMiddleware = (req, res, next) => passport.authenticate('jwt', { session: false })

function initApiAuth() {
  const opts = {
    secretOrKeyProvider: passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      // this needs to be dynamic, but forced to a hardcoded value for local testing
      jwksUri: `http://0.0.0.0:3331/.well-known/jwks.json`,
      // jwksUri: `${config.apis.oauth2.url}/.well-known/jwks.json`,
    }),

    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // this needs to be dynamic, but forced to a hardcoded value for local testing
    // issuer: `${config.apis.oauth2.url}/issuer`,
    issuer: `http://0.0.0.0:3331/.well-known/jwks.json`,
    algorithms: ['RS256'],
  }
  const jwtStrategy = new Strategy(opts, (jwtPayload, done) => {
    return done(null, jwtPayload)
  })
  passport.use(jwtStrategy)
}

module.exports = { apiAuthenticationMiddleware, initApiAuth }
