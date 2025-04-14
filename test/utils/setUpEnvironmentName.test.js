const setUpEnvironmentName = require('../../server/utils/setUpEnvironmentName')
const { config } = require('../../server/config')

describe('Set Up Environment Name', () => {
  let app

  beforeEach(() => {
    app = {
      locals: {},
    }
  })

  it('should set app.locals.environmentName to config.environment', () => {
    setUpEnvironmentName(app)

    expect(app.locals.environmentName).toBe(config.environment)
  })

  it('should set app.locals.environmentNameColour to "govuk-tag--green" when not a "prod" environment', () => {
    config.environment = 'dev'

    setUpEnvironmentName(app)

    expect(app.locals.environmentNameColour).toBe('govuk-tag--green')
  })

  it('should not set app.locals.environmentNameColour for "prod" environment', () => {
    config.environment = 'prod'

    setUpEnvironmentName(app)

    expect(app.locals.environmentNameColour).toBe('')
  })
})
