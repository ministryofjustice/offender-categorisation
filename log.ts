import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'

const isNode = typeof process !== 'undefined' && !!process.stdout

const formatOut = isNode ? bunyanFormat({ outputMode: 'json', color: true }, process.stdout) : undefined

const log = bunyan.createLogger({
  name: 'Cat tool',
  ...(formatOut && { stream: formatOut }),
  level: 'info',
})

export default log
