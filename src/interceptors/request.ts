/**
 * Request interceptor processing
 */

import type { InternalRequestConfig, RequestError } from '../types.js'
import type { InterceptorManagerImpl } from './manager.js'
import { isRequestError } from '../core/error.js'

/**
 * Apply request interceptors in order
 * Each interceptor can modify the config or throw an error
 */
export async function applyRequestInterceptors(
  config: InternalRequestConfig,
  manager: InterceptorManagerImpl<InternalRequestConfig>
): Promise<InternalRequestConfig> {
  let currentConfig = config
  const handlers = manager.getHandlers()

  for (const handler of handlers) {
    try {
      if (handler.fulfilled) {
        const result = handler.fulfilled(currentConfig)
        currentConfig = result instanceof Promise ? await result : result
      }
    } catch (error) {
      // If there's a rejected handler, try to recover
      if (handler.rejected) {
        try {
          const recovered = handler.rejected(
            isRequestError(error) ? error : createInterceptorError(error, currentConfig)
          )
          // If rejected returns a config, use it
          if (recovered && typeof recovered === 'object' && 'url' in recovered) {
            currentConfig = recovered as InternalRequestConfig
            continue
          }
          // If rejected returns a promise, wait for it
          if (recovered instanceof Promise) {
            const resolvedRecovered = await recovered
            if (resolvedRecovered && typeof resolvedRecovered === 'object' && 'url' in resolvedRecovered) {
              currentConfig = resolvedRecovered as InternalRequestConfig
              continue
            }
          }
        } catch (rejectedError) {
          throw isRequestError(rejectedError)
            ? rejectedError
            : createInterceptorError(rejectedError, currentConfig)
        }
      }
      throw isRequestError(error) ? error : createInterceptorError(error, currentConfig)
    }
  }

  return currentConfig
}

/**
 * Create an error for interceptor failures
 */
function createInterceptorError(
  error: unknown,
  config: InternalRequestConfig
): RequestError {
  const message = error instanceof Error ? error.message : 'Request interceptor error'

  return {
    name: 'RequestError',
    message,
    config,
    code: 'ERR_BAD_REQUEST',
  } as RequestError
}
