const crypto = require('crypto')
const express = require('express')
const helmet = require('helmet')
const config = require('../config')

module.exports = function setUpWebSecurity() {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  const scriptSrc = [
    "'self'",
    '*.google-analytics.com',
    '*.googletagmanager.com',
    (_req, res) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const styleSrc = ["'self'", (_req, res) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:', '*.google-analytics.com', '*.googletagmanager.com']
  const fontSrc = ["'self'"]

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  const helmetOptions = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
        // <script nonce="{{ cspNonce }}">
        // or
        // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
        // This ensures only scripts we trust are loaded, and not anything injected into the
        // page by an attacker.
        imgSrc,
        scriptSrc,
        styleSrc,
        fontSrc,
        formAction: [`'self' ${config.apis.oauth2.externalUrl}`],
        connectSrc: ["'self'", '*.google-analytics.com', '*.googletagmanager.com', '*.analytics.google.com'],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
  }

  router.use(helmet(helmetOptions))

  // cf. https://security-guidance.service.justice.gov.uk/implement-security-txt/
  router.get('/.well-known/security.txt', (req, res) =>
    res.redirect(301, 'https://security-guidance.service.justice.gov.uk/.well-known/security.txt')
  )

  return router
}
