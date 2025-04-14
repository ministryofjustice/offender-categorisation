const crypto = require('crypto')
const express = require('express')
const helmet = require('helmet')
const { config } = require('../config')

module.exports = function setUpWebSecurity() {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  const googleDomains = ['*.google-analytics.com', '*.analytics.google.com', '*.googletagmanager.com']
  const azureUrls = ['https://northeurope-0.in.applicationinsights.azure.com', '*.monitor.azure.com']
  const nonceFn = (_req, res) => `'nonce-${res.locals.cspNonce}'`

  const scriptSrc = ["'self'", ...googleDomains, ...azureUrls, nonceFn]
  const styleSrc = ["'self'", ...googleDomains, ...azureUrls, 'fonts.googleapis.com', nonceFn]
  const formAction = [`'self' ${config.apis.oauth2.externalUrl} ${config.dpsUrl}`]
  const imgSrc = ["'self'", 'data:', ...googleDomains, ...azureUrls]
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
        connectSrc: ["'self'", ...googleDomains, ...azureUrls, nonceFn],
        formAction,
        scriptSrc,
        styleSrc,
        imgSrc,
        fontSrc,
      },
    },
    crossOriginEmbedderPolicy: { policy: 'credentialless' },
    referrerPolicy: {
      policy: 'same-origin',
    },
  }

  router.use(helmet(helmetOptions))

  // cf. https://security-guidance.service.justice.gov.uk/implement-security-txt/
  router.get('/.well-known/security.txt', (req, res) =>
    res.redirect(301, 'https://security-guidance.service.justice.gov.uk/.well-known/security.txt'),
  )

  return router
}
