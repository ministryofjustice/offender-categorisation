module.exports = error => {
  console.log('ERR', error);
  if (error.response) {

    console.log('ERR RES', error.response);
    return {
      status: error.response.status,
      statusText: error.response.statusText,
      message: error.response.res.statusMessage || error.message,
      headers: error.response.headers,
      data: error.response.body,
      stack: error.stack,
    }
  }
  if (error.request) {
    // request is too big and best skipped
    console.log('ERR REQ', error.request);
    return {
      code: error.code,
      message: error.message,
      stack: error.stack,
    }
  }
  return {
    message: error.message,
    stack: error.stack,
  }
}
