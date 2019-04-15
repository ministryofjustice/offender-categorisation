module.exports = {
  unauthorisedError,
}

function unauthorisedError() {
  const error = new Error('Unauthorised access: required role not present')
  error.status = 403
  return error
}
