/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResponseError as SuperagentError } from 'superagent'

export interface SuperagentResponseError extends Error {
  response?: Response
  request?: any
  status?: number
  code?: string
  stack?: string
}

interface BaseParsedError {
  type: 'response' | 'request' | 'generic'
  message: string
  stack?: string
}

export interface SanitisedResponseError extends BaseParsedError {
  type: 'response'
  status?: number
  statusText?: string
  headers?: Record<string, any>
  data?: any
}

export interface RequestError extends BaseParsedError {
  type: 'request'
  code?: string
}

export interface GenericError extends BaseParsedError {
  type: 'generic'
  code?: string
}

export type ParsedError = SanitisedResponseError | RequestError | GenericError

export const getSanitisedError = (error: SuperagentError | unknown): ParsedError => {
  if (typeof error !== 'object' || error === null) {
    return {
      type: 'generic',
      message: String(error) || 'Non-object error',
    }
  }

  const e = error as SuperagentError

  if (e.response) {
    return {
      type: 'response',
      status: e.response.status,
      statusText: (e.response as any).statusText,
      message: (e.response as any).res?.statusMessage || e.message || 'Unknown response error',
      headers: e.response.headers,
      data: e.response.body,
      stack: e.stack,
    }
  }

  if ('request' in e) {
    // request is too big and best skipped
    return {
      type: 'request',
      code: (e as any).code,
      message: e.message || 'Request failed',
      stack: e.stack,
    }
  }

  return {
    type: 'generic',
    message: e.message || 'Unknown error',
    stack: e.stack,
  }
}
