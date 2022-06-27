module.exports = {
  unauthorisedError,
}

function unauthorisedError(message) {
  const error = new Error(message || 'Unauthorised access: required role not present')
  console.log("Errors.js", error)
  error.status = 403
  return error
}
