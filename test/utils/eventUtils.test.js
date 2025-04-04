const { events } = require('../../server/utils/eventUtils')

describe('eventUtils', () => {
  it('it exposes the EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED event identifier', () => {
    expect(events.EVENT_DOMAIN_PRISONER_OFFENDER_SEARCH_PRISONER_RELEASED).toEqual(
      'prisoner-offender-search.prisoner.released',
    )
  })
})
