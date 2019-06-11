const bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')
const { getNamespace } = require('cls-hooked')

const formatOut = bunyanFormat({
  outputMode: 'json',
  color: true,
})

const doLog = bunyan.createLogger({
  name: 'Cat tool',
  stream: formatOut,
  level: 'debug',
})

const arg1Wrapper = arg1 => {
  const ns = getNamespace('request.scope')
  const correlationId = ns ? ns.get('correlationId') : null
  if (typeof arg1 === 'string') {
    return { correlationId }
  }
  return { ...arg1, correlationId }
}

const arg2Wrapper = (arg1, arg2) => {
  if (typeof arg1 === 'string') {
    return arg1
  }
  return arg2
}

module.exports = {
  error: (arg1, arg2) => {
    doLog.error(arg1Wrapper(arg1), arg2Wrapper(arg1, arg2))
  },
  warn: (arg1, arg2) => {
    doLog.warn(arg1Wrapper(arg1), arg2Wrapper(arg1, arg2))
  },
  info: (arg1, arg2) => {
    doLog.info(arg1Wrapper(arg1), arg2Wrapper(arg1, arg2))
  },
  debug: (arg1, arg2) => {
    doLog.debug(arg1Wrapper(arg1), arg2Wrapper(arg1, arg2))
  },
}
