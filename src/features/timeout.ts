/**
 * Timeout handling utilities
 */

import type { InternalRequestConfig } from '../types.js'
import { createError } from '../core/error.js'

/**
 * Create an AbortSignal that will abort after specified milliseconds
 */
export function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort(new DOMException('Request timeout', 'TimeoutError'))
  }, ms)
  return controller.signal
}

/**
 * Combine multiple abort signals into one
 * The combined signal will abort when any of the input signals abort
 */
export function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController()

  for (const signal of signals) {
    if (!signal) continue

    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }

    signal.addEventListener(
      'abort',
      () => controller.abort(signal.reason),
      { once: true }
    )
  }

  return controller.signal
}

/**
 * Create a timeout error
 */
export function createTimeoutError(
  config: InternalRequestConfig,
  request?: Request
) {
  return createError(
    `Request timeout after ${config.timeout}ms`,
    config,
    'ERR_TIMEOUT',
    request
  )
}

/**
 * Apply timeout to a fetch operation
 * Returns a new signal that combines user signal with timeout signal
 */
export function applyTimeout(
  timeout: number | undefined,
  userSignal?: AbortSignal
): AbortSignal | undefined {
  if (!timeout || timeout <= 0) {
    return userSignal
  }

  const timeoutSignal = createTimeoutSignal(timeout)

  if (!userSignal) {
    return timeoutSignal
  }

  return combineSignals(timeoutSignal, userSignal)
}

/**
 * Check if an error is a timeout error (from AbortController)
 */
export function isTimeoutAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return true
  }
  if (error instanceof Error && error.name === 'AbortError') {
    const message = error.message.toLowerCase()
    return message.includes('timeout')
  }
  return false
}
