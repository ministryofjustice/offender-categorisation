const moment = require('moment')
const logger = require('../log')

module.exports =
  production =>
  // NOTE 'next' param MUST be included so that express recognises this as an error handler
  (error, req, res, next) => {
    logger.error(error)

    if (error.status === 401) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    // code to handle unknown errors
    const prodMessage = `Something went wrong at ${moment()}. The error has been logged. Please try again`
    res.locals.message = production ? prodMessage : error.message
    res.locals.status = error.status
    res.locals.stack = production ? null : error.stack
    res.status(error.status || 500)
    return res.render('pages/error')
  }
