const bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')

const formatOut = bunyanFormat({ outputMode: 'short', color: true })

const log = bunyan.createLogger({ name: 'Cat tool', stream: formatOut, level: 'info' })

module.exports = log
