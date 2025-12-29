/**
 * Request cancellation utilities
 */

import type { CancelToken as CancelTokenType, CancelTokenSource, Cancel } from '../types.js'

/**
 * Cancel class for identifying cancel reasons
 */
class CancelImpl implements Cancel {
  message?: string

  constructor(message?: string) {
    this.message = message
  }

  toString(): string {
    return this.message ?? 'Request canceled'
  }
}

/**
 * CancelToken implementation
 * Provides a way to cancel requests using a token pattern
 */
class CancelTokenImpl implements CancelTokenType {
  promise: Promise<Cancel>
  reason?: Cancel
  private resolvePromise!: (reason: Cancel) => void

  constructor() {
    this.promise = new Promise<Cancel>((resolve) => {
      this.resolvePromise = resolve
    })
  }

  /**
   * Throw if cancellation has been requested
   */
  throwIfRequested(): void {
    if (this.reason) {
      throw this.reason
    }
  }

  /**
   * Internal: trigger cancellation
   */
  _cancel(message?: string): void {
    if (this.reason) {
      // Already canceled
      return
    }
    this.reason = new CancelImpl(message)
    this.resolvePromise(this.reason)
  }
}

/**
 * CancelToken factory
 */
export const CancelToken = {
  /**
   * Create a new CancelToken source
   * Returns an object with token and cancel function
   */
  source(): CancelTokenSource {
    const token = new CancelTokenImpl()

    return {
      token,
      cancel: (message?: string) => {
        token._cancel(message)
      },
    }
  },
}

/**
 * Check if a value is a Cancel error
 */
export function isCancel(value: unknown): value is Cancel {
  return value instanceof CancelImpl
}

/**
 * Create an AbortController from a CancelToken
 */
export function cancelTokenToAbortController(token: CancelTokenType): AbortController {
  const controller = new AbortController()

  // If already canceled, abort immediately
  if (token.reason) {
    controller.abort(token.reason)
  } else {
    // Wait for cancellation
    token.promise.then((reason) => {
      controller.abort(reason)
    })
  }

  return controller
}

/**
 * Create a cancelable request wrapper
 */
export function makeCancelable<T>(
  promise: Promise<T>,
  controller: AbortController
): { data: Promise<T>; cancel: () => void } {
  return {
    data: promise,
    cancel: () => controller.abort(new CancelImpl('Canceled')),
  }
}

/**
 * Check if an error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
  if (isCancel(error)) {
    return true
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }

  return false
}
