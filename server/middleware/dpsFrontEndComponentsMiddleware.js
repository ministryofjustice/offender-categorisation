const logger = require('../../log').default

module.exports = function getFrontendComponents(frontEndComponentsService) {
  return async (req, res, next) => {
    try {
      if (res.locals?.user?.token) {
        const [header, footer] = await Promise.all([
          frontEndComponentsService.getComponent('header', res.locals?.user?.token),
          frontEndComponentsService.getComponent('footer', res.locals?.user?.token),
        ])

        res.locals.feComponents = {
          header: header.html,
          footer: footer.html,
          cssIncludes: [...header.css, ...footer.css],
          jsIncludes: [...header.javascript, ...footer.javascript],
        }
      }

      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
