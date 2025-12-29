/**
 * RequestKit Client Factory
 */

import type {
  ClientConfig,
  RequestOptions,
  RequestClient,
  Interceptors,
  InternalRequestConfig,
  RequestResponse,
  CancelableRequest,
} from '../types.js'
import { deepMerge, deepClone } from '../utils/merge.js'
import { createInterceptorManager, type InterceptorManagerImpl } from '../interceptors/manager.js'
import { applyRequestInterceptors } from '../interceptors/request.js'
import { applyResponseInterceptors, applyErrorInterceptors } from '../interceptors/response.js'
import { mergeConfig, prepareRequest, executeFetch, DEFAULT_CONFIG } from './request.js'
import { processResponse, isSuccessStatus } from './response.js'
import { createNetworkError, createResponseError, isRequestError } from './error.js'
import { applyTimeout, isTimeoutAbortError } from '../features/timeout.js'
import { withRetry } from '../features/retry.js'
import { trackDownloadProgress, wrapBodyWithProgress } from '../features/progress.js'
import { makeCancelable } from '../features/cancel.js'
import { isPlainObject } from '../utils/is.js'

/**
 * Create a new RequestKit client
 */
export function createClient(config: ClientConfig = {}): RequestClient {
  // Merge with defaults
  const defaults: ClientConfig = deepMerge(DEFAULT_CONFIG, config)

  // Create interceptor managers
  const requestInterceptors = createInterceptorManager<InternalRequestConfig>()
  const responseInterceptors = createInterceptorManager<Response>()

  // Interceptors object
  const interceptors: Interceptors = {
    request: requestInterceptors,
    response: responseInterceptors,
  }

  /**
   * Main request function
   */
  async function request<T = unknown>(
    urlOrOptions: string | (RequestOptions & { url: string }),
    options?: RequestOptions
  ): Promise<T | RequestResponse<T> | CancelableRequest<T>> {
    // Normalize arguments
    let mergedOptions: RequestOptions & { url?: string }

    if (typeof urlOrOptions === 'string') {
      mergedOptions = { ...options, url: urlOrOptions }
    } else {
      mergedOptions = urlOrOptions
    }

    // Create internal config
    let internalConfig = mergeConfig(defaults, mergedOptions)

    // Apply onRequest hook from config
    if (defaults.onRequest) {
      const result = defaults.onRequest(internalConfig)
      internalConfig = result instanceof Promise ? await result : result
    }

    // Apply request interceptors
    internalConfig = await applyRequestInterceptors(
      internalConfig,
      requestInterceptors as InterceptorManagerImpl<InternalRequestConfig>
    )

    // Handle cancelable option
    const cancelable = mergedOptions.cancelable
    let abortController: AbortController | undefined

    if (cancelable) {
      abortController = new AbortController()
      internalConfig.signal = abortController.signal
    }

    // Apply timeout
    const originalSignal = internalConfig.signal
    const timeout = internalConfig.timeout
    if (timeout && timeout > 0) {
      internalConfig.signal = applyTimeout(timeout, originalSignal)
    }

    // Create the fetch execution function
    const executeRequest = async (): Promise<T | RequestResponse<T>> => {
      let fetchRequest: Request | undefined

      try {
        // Prepare request
        fetchRequest = prepareRequest(internalConfig)

        // Handle upload progress
        if (internalConfig.onUploadProgress && fetchRequest.body) {
          // Clone the body for progress tracking
          const originalBody = internalConfig.body ?? internalConfig.json ?? internalConfig.form
          if (originalBody) {
            const { body: serializedBody } = await import('../serializers/body.js').then(m => m.serializeBody(internalConfig))
            if (serializedBody) {
              const trackedBody = wrapBodyWithProgress(
                serializedBody,
                internalConfig.onUploadProgress
              )
              // Recreate request with tracked body
              fetchRequest = new Request(fetchRequest.url, {
                method: fetchRequest.method,
                headers: fetchRequest.headers,
                body: trackedBody,
                signal: internalConfig.signal,
                credentials: internalConfig.credentials,
                cache: internalConfig.cache,
                mode: internalConfig.mode,
              })
            }
          }
        }

        // Execute fetch
        let response = await executeFetch(fetchRequest)

        // Handle download progress
        if (internalConfig.onDownloadProgress) {
          response = trackDownloadProgress(response, internalConfig.onDownloadProgress)
        }

        // Apply onResponse hook from config
        if (defaults.onResponse) {
          const result = defaults.onResponse(response)
          response = result instanceof Promise ? await result : result
        }

        // Apply response interceptors
        response = await applyResponseInterceptors(
          response,
          responseInterceptors as InterceptorManagerImpl<Response>,
          internalConfig
        )

        // Validate status
        const validateStatus = internalConfig.validateStatus ?? DEFAULT_CONFIG.validateStatus
        if (!isSuccessStatus(response.status, validateStatus)) {
          const error = await createResponseError(response, internalConfig, fetchRequest)

          // Apply onError hook
          if (defaults.onError) {
            defaults.onError(error)
          }

          throw error
        }

        // Process response
        return processResponse<T>(response, internalConfig, fetchRequest)

      } catch (error) {
        // Handle network/abort errors
        if (!isRequestError(error)) {
          const networkError = createNetworkError(
            error as Error,
            internalConfig,
            fetchRequest
          )

          // Apply onError hook
          if (defaults.onError) {
            defaults.onError(networkError)
          }

          // Check for timeout
          if (isTimeoutAbortError(error as Error)) {
            networkError.code = 'ERR_TIMEOUT'
            networkError.message = `Request timeout after ${timeout}ms`
          }

          // Try to recover with error interceptors
          try {
            const recovered = await applyErrorInterceptors(
              networkError,
              responseInterceptors as InterceptorManagerImpl<Response>,
              internalConfig
            )
            return processResponse<T>(recovered, internalConfig, fetchRequest)
          } catch {
            throw networkError
          }
        }

        // Already a RequestError
        if (defaults.onError && !isRequestError(error)) {
          defaults.onError(error as import('../types.js').RequestError)
        }

        // Try to recover with error interceptors
        try {
          const recovered = await applyErrorInterceptors(
            error as import('../types.js').RequestError,
            responseInterceptors as InterceptorManagerImpl<Response>,
            internalConfig
          )
          return processResponse<T>(recovered, internalConfig, fetchRequest)
        } catch {
          throw error
        }
      }
    }

    // Apply retry logic
    const retryConfig = internalConfig.retry
    const resultPromise = withRetry(
      executeRequest,
      retryConfig,
      internalConfig
    )

    // Return cancelable if requested
    if (cancelable && abortController) {
      return makeCancelable(resultPromise as Promise<T>, abortController)
    }

    return resultPromise
  }

  /**
   * HTTP method shortcuts
   */
  function get<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, { ...options, method: 'GET' }) as Promise<T>
  }

  function post<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const opts: RequestOptions = { ...options, method: 'POST' }
    if (body !== undefined) {
      if (isPlainObject(body)) {
        opts.json = body as Record<string, unknown>
      } else {
        opts.body = body as BodyInit
      }
    }
    return request<T>(url, opts) as Promise<T>
  }

  function put<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const opts: RequestOptions = { ...options, method: 'PUT' }
    if (body !== undefined) {
      if (isPlainObject(body)) {
        opts.json = body as Record<string, unknown>
      } else {
        opts.body = body as BodyInit
      }
    }
    return request<T>(url, opts) as Promise<T>
  }

  function patch<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const opts: RequestOptions = { ...options, method: 'PATCH' }
    if (body !== undefined) {
      if (isPlainObject(body)) {
        opts.json = body as Record<string, unknown>
      } else {
        opts.body = body as BodyInit
      }
    }
    return request<T>(url, opts) as Promise<T>
  }

  function del<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    return request<T>(url, { ...options, method: 'DELETE' }) as Promise<T>
  }

  function head(url: string, options?: RequestOptions): Promise<void> {
    return request<void>(url, { ...options, method: 'HEAD' }) as Promise<void>
  }

  function options_(url: string, options?: RequestOptions): Promise<void> {
    return request<void>(url, { ...options, method: 'OPTIONS' }) as Promise<void>
  }

  /**
   * Create an extended client with merged config
   */
  function extend(extendConfig: ClientConfig): RequestClient {
    const mergedConfig = deepMerge(defaults, extendConfig)
    const extendedClient = createClient(mergedConfig)

    // Copy interceptors
    requestInterceptors.forEach((handler) => {
      extendedClient.interceptors.request.use(handler.fulfilled, handler.rejected)
    })
    responseInterceptors.forEach((handler) => {
      extendedClient.interceptors.response.use(handler.fulfilled, handler.rejected)
    })

    return extendedClient
  }

  /**
   * Clone the client
   */
  function clone(): RequestClient {
    const clonedConfig = deepClone(defaults)
    const clonedClient = createClient(clonedConfig)

    // Copy interceptors
    requestInterceptors.forEach((handler) => {
      clonedClient.interceptors.request.use(handler.fulfilled, handler.rejected)
    })
    responseInterceptors.forEach((handler) => {
      clonedClient.interceptors.response.use(handler.fulfilled, handler.rejected)
    })

    return clonedClient
  }

  // Build and return client
  const client: RequestClient = {
    request: request as RequestClient['request'],
    get,
    post,
    put,
    patch,
    delete: del,
    head,
    options: options_,
    interceptors,
    defaults,
    extend,
    clone,
  }

  return client
}
