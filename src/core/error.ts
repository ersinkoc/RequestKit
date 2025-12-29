/**
 * Error handling utilities
 */

import type { RequestError, ErrorCode, InternalRequestConfig } from '../types.js'

/**
 * RequestError class for HTTP errors
 */
export class RequestErrorImpl extends Error implements RequestError {
  override readonly name = 'RequestError' as const
  status?: number
  statusText?: string
  data?: unknown
  config: InternalRequestConfig
  request?: Request
  response?: Response
  code?: ErrorCode

  constructor(
    message: string,
    config: InternalRequestConfig,
    code?: ErrorCode,
    request?: Request,
    response?: Response,
    data?: unknown
  ) {
    super(message)
    this.config = config
    this.code = code
    this.request = request
    this.response = response
    this.data = data

    if (response) {
      this.status = response.status
      this.statusText = response.statusText
    }

    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestErrorImpl)
    }

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, RequestErrorImpl.prototype)
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      code: this.code,
      data: this.data,
      config: {
        url: this.config.url,
        method: this.config.method,
        baseURL: this.config.baseURL,
      },
    }
  }
}

/**
 * Create a RequestError from various inputs
 */
export function createError(
  message: string,
  config: InternalRequestConfig,
  code?: ErrorCode,
  request?: Request,
  response?: Response,
  data?: unknown
): RequestError {
  return new RequestErrorImpl(message, config, code, request, response, data)
}

/**
 * Create error from a failed fetch
 */
export function createNetworkError(
  error: Error,
  config: InternalRequestConfig,
  request?: Request
): RequestError {
  // Check if it's an abort error
  if (error.name === 'AbortError') {
    return createError(
      error.message || 'Request aborted',
      config,
      'ERR_CANCELED',
      request
    )
  }

  // Check if it's a timeout error (custom timeout implementation)
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return createError(
      error.message || 'Request timeout',
      config,
      'ERR_TIMEOUT',
      request
    )
  }

  // Generic network error
  return createError(
    error.message || 'Network error',
    config,
    'ERR_NETWORK',
    request
  )
}

/**
 * Create error from HTTP response
 */
export async function createResponseError(
  response: Response,
  config: InternalRequestConfig,
  request?: Request
): Promise<RequestError> {
  const status = response.status
  const statusText = response.statusText

  // Try to parse response body
  let data: unknown
  try {
    const text = await response.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  } catch {
    data = undefined
  }

  // Determine error code based on status
  const code: ErrorCode = status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST'

  // Create descriptive message
  const message = `Request failed with status ${status}${statusText ? `: ${statusText}` : ''}`

  return createError(message, config, code, request, response, data)
}

/**
 * Type guard to check if error is a RequestError
 */
export function isRequestError(error: unknown): error is RequestError {
  return (
    error instanceof RequestErrorImpl ||
    (error instanceof Error &&
      error.name === 'RequestError' &&
      'config' in error)
  )
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return isRequestError(error) && error.code === 'ERR_NETWORK'
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return isRequestError(error) && error.code === 'ERR_TIMEOUT'
}

/**
 * Check if error is a cancel/abort error
 */
export function isCancelError(error: unknown): boolean {
  if (isRequestError(error)) {
    return error.code === 'ERR_CANCELED'
  }
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  return isRequestError(error) && error.code === 'ERR_BAD_REQUEST'
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  return isRequestError(error) && error.code === 'ERR_BAD_RESPONSE'
}

/**
 * Get status code from error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isRequestError(error)) {
    return error.status
  }
  return undefined
}
