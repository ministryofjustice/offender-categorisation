module.exports = {
  unauthorisedError,
}

function unauthorisedError(message) {
  const error = new Error(message || 'Unauthorised access: required role not present')
  error.status = 403
  return error
}
