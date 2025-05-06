export interface ParsedError {
  status?: number
  statusText?: string
  message: string
  headers?: Record<string, any>
  data?: any
  code?: string
  stack?: string
}

export const getSanitisedError = (error: any): ParsedError => {
  if (error.response) {
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
