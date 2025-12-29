/**
 * Retry logic with exponential backoff
 */

import type { RetryConfig, HttpMethod, InternalRequestConfig, RequestError } from '../types.js'
import { delay } from '../utils/delay.js'
import { isCancelError } from '../core/error.js'

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  limit: 0,
  methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  statusCodes: [408, 429, 500, 502, 503, 504],
  delay: 1000,
  backoff: 'exponential',
  maxDelay: 30000,
  retryCondition: () => true,
  onRetry: () => {},
}

/**
 * Normalize retry config
 * Accepts number (limit) or RetryConfig object
 */
export function normalizeRetryConfig(
  config: number | RetryConfig | undefined
): Required<RetryConfig> {
  if (config === undefined || config === 0) {
    return { ...DEFAULT_RETRY_CONFIG, limit: 0 }
  }

  if (typeof config === 'number') {
    return { ...DEFAULT_RETRY_CONFIG, limit: config }
  }

  return {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
    methods: config.methods ?? DEFAULT_RETRY_CONFIG.methods,
    statusCodes: config.statusCodes ?? DEFAULT_RETRY_CONFIG.statusCodes,
  }
}

/**
 * Calculate delay for retry attempt
 */
export function calculateDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  const { delay: baseDelay, backoff, maxDelay } = config

  let calculatedDelay: number

  if (backoff === 'linear') {
    // Linear: delay * attempt (1x, 2x, 3x, ...)
    calculatedDelay = baseDelay * attempt
  } else {
    // Exponential: delay * 2^(attempt-1) (1x, 2x, 4x, 8x, ...)
    calculatedDelay = baseDelay * Math.pow(2, attempt - 1)
  }

  // Apply max delay cap
  return Math.min(calculatedDelay, maxDelay)
}

/**
 * Check if error should trigger a retry
 */
export function shouldRetry(
  error: RequestError,
  attempt: number,
  config: Required<RetryConfig>,
  method: HttpMethod
): boolean {
  // Check if we've exceeded the limit
  if (attempt >= config.limit) {
    return false
  }

  // Don't retry canceled or timeout errors (user initiated)
  if (isCancelError(error)) {
    return false
  }

  // Check if method is retryable
  if (!config.methods.includes(method)) {
    return false
  }

  // Check status code if available
  if (error.status !== undefined) {
    if (!config.statusCodes.includes(error.status)) {
      return false
    }
  }

  // Apply custom retry condition
  if (!config.retryCondition(error)) {
    return false
  }

  return true
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: number | RetryConfig | undefined,
  requestConfig: InternalRequestConfig
): Promise<T> {
  const config = normalizeRetryConfig(retryConfig)

  if (config.limit === 0) {
    // No retry configured
    return fn()
  }

  let lastError: RequestError | undefined
  let attempt = 0

  while (attempt <= config.limit) {
    try {
      return await fn()
    } catch (error) {
      const requestError = error as RequestError
      lastError = requestError

      attempt++

      // Check if we should retry
      if (!shouldRetry(requestError, attempt, config, requestConfig.method)) {
        throw requestError
      }

      // Calculate delay
      const retryDelay = calculateDelay(attempt, config)

      // Call onRetry callback
      config.onRetry(attempt, requestError, requestConfig)

      // Wait before retrying
      await delay(retryDelay)

      // Check if request was aborted during delay
      if (requestConfig.signal?.aborted) {
        throw requestError
      }
    }
  }

  // This shouldn't happen, but TypeScript needs it
  throw lastError ?? new Error('Retry failed')
}

/**
 * Get retry delay from Retry-After header
 */
export function getRetryAfterDelay(response: Response): number | undefined {
  const retryAfter = response.headers.get('Retry-After')

  if (!retryAfter) {
    return undefined
  }

  // Check if it's a number (seconds)
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000 // Convert to milliseconds
  }

  // Check if it's a date
  const date = new Date(retryAfter)
  if (!isNaN(date.getTime())) {
    const delay = date.getTime() - Date.now()
    return delay > 0 ? delay : undefined
  }

  return undefined
}
