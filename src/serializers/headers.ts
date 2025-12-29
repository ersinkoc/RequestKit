/**
 * Headers utilities
 */

import { isHeaders, isPlainObject, isArray } from '../utils/is.js'

/**
 * Normalize various header input types to Headers object
 */
export function normalizeHeaders(
  headers?: HeadersInit | Record<string, string>
): Headers {
  if (!headers) {
    return new Headers()
  }

  if (isHeaders(headers)) {
    // Clone to avoid mutation
    const result = new Headers()
    headers.forEach((value, key) => {
      result.set(key, value)
    })
    return result
  }

  if (isArray(headers)) {
    return new Headers(headers as [string, string][])
  }

  if (isPlainObject(headers)) {
    const result = new Headers()
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result.set(key, String(value))
      }
    }
    return result
  }

  return new Headers(headers as HeadersInit)
}

/**
 * Merge multiple header sources
 * Later sources override earlier ones
 */
export function mergeHeaders(
  ...sources: Array<HeadersInit | Record<string, string> | undefined>
): Headers {
  const result = new Headers()

  for (const source of sources) {
    if (!source) {
      continue
    }

    const normalized = normalizeHeaders(source)
    normalized.forEach((value, key) => {
      if (value === '') {
        // Empty string means remove header
        result.delete(key)
      } else {
        result.set(key, value)
      }
    })
  }

  return result
}

/**
 * Convert Headers to plain object
 */
export function parseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}

  headers.forEach((value, key) => {
    result[key] = value
  })

  return result
}

/**
 * Set header if not already present
 */
export function setHeaderIfMissing(
  headers: Headers,
  key: string,
  value: string
): void {
  if (!headers.has(key)) {
    headers.set(key, value)
  }
}

/**
 * Get header value (case-insensitive)
 */
export function getHeader(
  headers: Headers | HeadersInit | Record<string, string> | undefined,
  key: string
): string | undefined {
  if (!headers) {
    return undefined
  }

  if (isHeaders(headers)) {
    return headers.get(key) ?? undefined
  }

  const lowerKey = key.toLowerCase()

  if (isArray(headers)) {
    const found = headers.find(
      ([k]) => k.toLowerCase() === lowerKey
    )
    return found?.[1]
  }

  if (isPlainObject(headers)) {
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lowerKey) {
        return v
      }
    }
  }

  return undefined
}

/**
 * Check if header exists (case-insensitive)
 */
export function hasHeader(
  headers: Headers | HeadersInit | Record<string, string> | undefined,
  key: string
): boolean {
  return getHeader(headers, key) !== undefined
}

/**
 * Common content type constants
 */
export const ContentTypes = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  OCTET_STREAM: 'application/octet-stream',
} as const

/**
 * Check if content type is JSON
 */
export function isJSONContentType(contentType?: string | null): boolean {
  if (!contentType) {
    return false
  }
  return contentType.includes('application/json') || contentType.includes('+json')
}

/**
 * Check if content type is text-based
 */
export function isTextContentType(contentType?: string | null): boolean {
  if (!contentType) {
    return false
  }
  return (
    contentType.startsWith('text/') ||
    isJSONContentType(contentType) ||
    contentType.includes('application/xml') ||
    contentType.includes('+xml')
  )
}
