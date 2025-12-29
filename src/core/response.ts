/**
 * Response handling utilities
 */

import type {
  ResponseType,
  InternalRequestConfig,
  RequestResponse,
  TransformFn,
} from '../types.js'
import { isFunction, isArray } from '../utils/is.js'
import { isJSONContentType } from '../serializers/headers.js'

/**
 * Parse response based on response type
 */
export async function parseResponse<T>(
  response: Response,
  responseType: ResponseType = 'json'
): Promise<T> {
  switch (responseType) {
    case 'text':
      return (await response.text()) as T

    case 'blob':
      return (await response.blob()) as T

    case 'arrayBuffer':
      return (await response.arrayBuffer()) as T

    case 'stream':
      return response.body as T

    case 'raw':
      // Return the response as-is (caller handles it)
      return response as unknown as T

    case 'json':
    default: {
      // Check content type to decide parsing strategy
      const contentType = response.headers.get('content-type')

      // If content-length is 0 or status is 204, return undefined
      const contentLength = response.headers.get('content-length')
      if (
        contentLength === '0' ||
        response.status === 204 ||
        response.status === 205
      ) {
        return undefined as T
      }

      // Try to parse as JSON
      if (isJSONContentType(contentType)) {
        // Clone response before parsing to allow fallback to text
        const cloned = response.clone()
        try {
          return (await response.json()) as T
        } catch {
          // If JSON parsing fails, return text from cloned response
          return (await cloned.text()) as T
        }
      }

      // For non-JSON content types, try JSON first, fall back to text
      const text = await response.text()
      if (!text) {
        return undefined as T
      }

      try {
        return JSON.parse(text) as T
      } catch {
        return text as T
      }
    }
  }
}

/**
 * Apply transform functions to data
 */
export function applyTransform(
  data: unknown,
  transforms: TransformFn | TransformFn[] | undefined,
  headers?: Headers
): unknown {
  if (!transforms) {
    return data
  }

  const transformArray = isArray(transforms) ? transforms : [transforms]
  let result = data

  for (const transform of transformArray) {
    if (isFunction(transform)) {
      result = transform(result, headers)
    }
  }

  return result
}

/**
 * Build full response object
 */
export function buildResponse<T>(
  data: T,
  response: Response,
  config: InternalRequestConfig,
  request?: Request
): RequestResponse<T> {
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config,
    request,
    ok: response.ok,
  }
}

/**
 * Process response based on config
 */
export async function processResponse<T>(
  response: Response,
  config: InternalRequestConfig,
  request?: Request
): Promise<T | RequestResponse<T>> {
  // Parse response based on responseType
  const responseType = config.responseType ?? 'json'
  let data = await parseResponse<T>(response, responseType)

  // Apply transform
  data = applyTransform(data, config.transformResponse, response.headers) as Awaited<T>

  // Return raw response if requested
  if (config.raw) {
    return buildResponse(data, response, config, request)
  }

  return data as Awaited<T>
}

/**
 * Check if response is successful based on validateStatus
 */
export function isSuccessStatus(
  status: number,
  validateStatus?: (status: number) => boolean
): boolean {
  if (validateStatus) {
    return validateStatus(status)
  }
  // Default: 2xx is success
  return status >= 200 && status < 300
}

/**
 * Clone a response for retry or caching purposes
 */
export function cloneResponse(response: Response): Response {
  return response.clone()
}

/**
 * Get response size from headers
 */
export function getResponseSize(response: Response): number {
  const contentLength = response.headers.get('content-length')
  return contentLength ? parseInt(contentLength, 10) : 0
}
