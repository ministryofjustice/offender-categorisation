const express = require('express')
const supertest = require('supertest')
const setUpWebSecurity = require('../../server/utils/setUpWebSecurity')

describe('Set Up Web Security', () => {
  let app

  beforeAll(() => {
    app = express()
    app.use(setUpWebSecurity())
  })

  it('should set up Content Security Policy (CSP)', async () => {
    const response = await supertest(app).get('/')
    expect(response.header['content-security-policy']).toBeDefined()
  })

  it('should set up Cross-Origin Embedder Policy', async () => {
    const response = await supertest(app).get('/some-route')
    expect(response.header['cross-origin-embedder-policy']).toBeDefined()
    expect(response.header['cross-origin-embedder-policy']).toContain('credentialless')
  })

  it('should handle /well-known/security.txt route', async () => {
    const response = await supertest(app).get('/.well-known/security.txt')
    expect(response.status).toBe(301)
    expect(response.header.location).toBe('https://security-guidance.service.justice.gov.uk/.well-known/security.txt')
  })
})
