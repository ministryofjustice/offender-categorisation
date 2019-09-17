const types = {
  NEW: { name: 'NEW', value: 'New risk change alert' },
  REVIEW_REQUIRED: { name: 'REVIEW_REQUIRED', value: 'Review required' },
  REVIEW_NOT_REQUIRED: { name: 'REVIEW_NOT_REQUIRED', value: 'Review not required' },
  REVIEWED_FIRST: { name: 'REVIEWED_FIRST', value: 'Review took place before risk alert processed' },
}

module.exports = Object.freeze(types)
