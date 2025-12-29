/**
 * Request execution core
 */

import type {
  ClientConfig,
  RequestOptions,
  InternalRequestConfig,
  HttpMethod,
  TransformFn,
} from '../types.js'
import { combineURLs, buildURL, isAbsoluteURL } from '../utils/url.js'
import { deepMerge } from '../utils/merge.js'
import { isFunction, isArray, isPlainObject } from '../utils/is.js'
import { serializeBody, shouldHaveBody } from '../serializers/body.js'
import { mergeHeaders, setHeaderIfMissing } from '../serializers/headers.js'
import { applyParamsSerializer } from '../serializers/params.js'

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Partial<ClientConfig> = {
  timeout: 0,
  responseType: 'json',
  validateStatus: (status: number) => status >= 200 && status < 300,
}

/**
 * Build the full URL from config
 */
export function buildFullURL(config: InternalRequestConfig): string {
  let url = config.url

  // Combine with base URL if not absolute
  if (config.baseURL && !isAbsoluteURL(url)) {
    url = combineURLs(config.baseURL, url)
  }

  // Add query params
  if (config.params) {
    const serializedParams = applyParamsSerializer(
      config.params as Record<string, unknown>,
      config.paramsSerializer
    )
    url = buildURL(url, serializedParams)
  }

  return url
}

/**
 * Apply request transforms to data
 */
export function applyRequestTransform(
  data: unknown,
  transforms: TransformFn | TransformFn[] | undefined,
  headers: Headers
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
 * Merge request options with defaults
 */
export function mergeConfig(
  defaults: ClientConfig,
  options: RequestOptions & { url?: string } = {}
): InternalRequestConfig {
  // Start with defaults
  const merged = deepMerge<ClientConfig>(DEFAULT_CONFIG, defaults, options)

  // Merge headers specially
  const headers = mergeHeaders(
    defaults.headers,
    options.headers
  )

  // Build internal config
  const config: InternalRequestConfig = {
    ...merged,
    url: options.url ?? '',
    method: (options.method ?? 'GET').toUpperCase() as HttpMethod,
    headers,
    baseURL: defaults.baseURL,
  }

  return config
}

/**
 * Prepare request for execution
 * Returns Request object ready for fetch
 */
export function prepareRequest(config: InternalRequestConfig): Request {
  // Build full URL
  const url = buildFullURL(config)

  // Serialize body
  let body: BodyInit | undefined
  let contentType: string | undefined

  if (shouldHaveBody(config.method)) {
    const serialized = serializeBody(config)
    body = serialized.body

    // Apply request transform if body is an object
    if (body && config.transformRequest) {
      const transformed = applyRequestTransform(
        isPlainObject(config.body) || isPlainObject(config.json)
          ? (config.json ?? config.body)
          : body,
        config.transformRequest,
        config.headers
      )

      // If transform returned something different, re-serialize
      if (transformed !== body && isPlainObject(transformed)) {
        body = JSON.stringify(transformed)
        contentType = 'application/json;charset=UTF-8'
      }
    }

    contentType = contentType ?? serialized.contentType
  }

  // Set content type if determined and not already set
  if (contentType) {
    setHeaderIfMissing(config.headers, 'Content-Type', contentType)
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: config.method,
    headers: config.headers,
    body,
    signal: config.signal,
    credentials: config.credentials,
    cache: config.cache,
    mode: config.mode,
  }

  return new Request(url, fetchOptions)
}

/**
 * Execute fetch with error handling
 */
export async function executeFetch(request: Request): Promise<Response> {
  return fetch(request)
}
