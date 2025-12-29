/**
 * Interceptor Manager
 * Manages request/response interceptors
 */

import type { InterceptorManager, InterceptorHandler, RequestError } from '../types.js'

/**
 * InterceptorManager implementation
 * Stores and manages interceptor handlers
 */
export class InterceptorManagerImpl<T> implements InterceptorManager<T> {
  private handlers: Map<number, InterceptorHandler<T>> = new Map()
  private nextId = 0

  /**
   * Add a new interceptor
   * @returns ID for removal
   */
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: RequestError) => unknown
  ): number {
    const id = this.nextId++
    this.handlers.set(id, {
      fulfilled: onFulfilled,
      rejected: onRejected,
    })
    return id
  }

  /**
   * Remove an interceptor by ID
   */
  eject(id: number): void {
    this.handlers.delete(id)
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Iterate over all handlers
   */
  forEach(fn: (handler: InterceptorHandler<T>) => void): void {
    this.handlers.forEach(fn)
  }

  /**
   * Get handlers as array (preserves insertion order)
   */
  getHandlers(): InterceptorHandler<T>[] {
    return Array.from(this.handlers.values())
  }

  /**
   * Get handlers count
   */
  get size(): number {
    return this.handlers.size
  }
}

/**
 * Create a new interceptor manager
 */
export function createInterceptorManager<T>(): InterceptorManagerImpl<T> {
  return new InterceptorManagerImpl<T>()
}
