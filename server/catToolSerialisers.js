const bunyan = require('bunyan')
const { getNamespace } = require('cls-hooked')

const redactSession = msg => msg.replace(/session=[A-Za-z0-9=]+/, 'session=REDACTED')

module.exports = {
  err: bunyan.stdSerializers.err,
  req(req) {
    const req1 = bunyan.stdSerializers.req(req)
    if (req1.headers && req1.headers.cookie) {
      req1.headers.cookie = redactSession(req1.headers.cookie)
    }
    return req1
  },
  res(res) {
    const res1 = bunyan.stdSerializers.res(res)
    if (res1.header) {
      res1.header = redactSession(res1.header)
    }
    // TODO will do for now, need to come back and set correlationId for *all logging though
    const ns = getNamespace('page.scope')
    res1.correlationId = ns.get('correlationId')
    return res1
  },
}
