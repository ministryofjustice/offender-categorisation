const fs = require('fs')
const path = require('path')
const { config } = require('./config')

const applicationRootPath = config.environment !== 'local' ? '/app/dist' : './'

const packageData = JSON.parse(fs.readFileSync(path.join(applicationRootPath, 'package.json')))
const buildNumber = fs.existsSync(path.join(applicationRootPath, 'build-info.json'))
  ? JSON.parse(fs.readFileSync(path.join(applicationRootPath, 'build-info.json'))).buildNumber
  : packageData.version
module.exports = { buildNumber, packageData }
