/**
 * Async delay utilities
 */

/**
 * Create a promise that resolves after specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create an abortable delay
 * Returns a promise that resolves after ms, or rejects if signal is aborted
 */
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function timeout(ms: number, message = 'Timeout'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Timeout'
): Promise<T> {
  if (ms <= 0) {
    return promise
  }

  return Promise.race([
    promise,
    timeout(ms, message),
  ])
}
