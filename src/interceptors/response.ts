/**
 * Response interceptor processing
 */

import type { InternalRequestConfig, RequestError } from '../types.js'
import type { InterceptorManagerImpl } from './manager.js'
import { isRequestError, createError } from '../core/error.js'

/**
 * Apply response interceptors in reverse order
 * This creates a wrapping pattern where first-added interceptors
 * are executed last (wrapping the inner interceptors)
 */
export async function applyResponseInterceptors(
  response: Response,
  manager: InterceptorManagerImpl<Response>,
  config: InternalRequestConfig
): Promise<Response> {
  let currentResponse = response
  // Reverse order for response interceptors
  const handlers = manager.getHandlers().slice().reverse()

  for (const handler of handlers) {
    try {
      if (handler.fulfilled) {
        const result = handler.fulfilled(currentResponse)
        currentResponse = result instanceof Promise ? await result : result
      }
    } catch (error) {
      // If there's a rejected handler, try to recover
      if (handler.rejected) {
        try {
          const recovered = handler.rejected(
            isRequestError(error) ? error : createInterceptorError(error, config, currentResponse)
          )

          // If rejected returns a Response, use it
          if (recovered instanceof Response) {
            currentResponse = recovered
            continue
          }

          // If rejected returns a promise, wait for it
          if (recovered instanceof Promise) {
            const resolvedRecovered = await recovered
            if (resolvedRecovered instanceof Response) {
              currentResponse = resolvedRecovered
              continue
            }
          }
        } catch (rejectedError) {
          throw isRequestError(rejectedError)
            ? rejectedError
            : createInterceptorError(rejectedError, config, currentResponse)
        }
      }

      throw isRequestError(error) ? error : createInterceptorError(error, config, currentResponse)
    }
  }

  return currentResponse
}

/**
 * Apply error interceptors
 * Called when a request or response error occurs
 */
export async function applyErrorInterceptors(
  error: RequestError,
  manager: InterceptorManagerImpl<Response>,
  config: InternalRequestConfig
): Promise<Response | never> {
  const handlers = manager.getHandlers().slice().reverse()

  for (const handler of handlers) {
    if (handler.rejected) {
      try {
        const recovered = handler.rejected(error)

        // If rejected returns a Response, use it as successful recovery
        if (recovered instanceof Response) {
          return recovered
        }

        // If rejected returns a promise, wait for it
        if (recovered instanceof Promise) {
          const resolvedRecovered = await recovered
          if (resolvedRecovered instanceof Response) {
            return resolvedRecovered
          }
        }

        // If rejected doesn't throw, the error is considered handled
        // but we still need to propagate if no Response is returned
      } catch (rejectedError) {
        // Update error and continue to next handler
        error = isRequestError(rejectedError)
          ? rejectedError
          : createInterceptorError(rejectedError, config)
      }
    }
  }

  // No handler recovered the error, throw it
  throw error
}

/**
 * Create an error for interceptor failures
 */
function createInterceptorError(
  error: unknown,
  config: InternalRequestConfig,
  response?: Response
): RequestError {
  const message = error instanceof Error ? error.message : 'Response interceptor error'

  return createError(
    message,
    config,
    response ? (response.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST') : 'ERR_BAD_REQUEST',
    undefined,
    response
  )
}
