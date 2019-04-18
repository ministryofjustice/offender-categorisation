const bunyan = require('bunyan')

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
    return res1
  },
}
