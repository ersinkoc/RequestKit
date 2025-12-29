/**
 * Request body serialization utilities
 */

import type { RequestOptions } from '../types.js'
import {
  isFormData,
  isBlob,
  isArrayBuffer,
  isArrayBufferView,
  isURLSearchParams,
  isStream,
  isPlainObject,
  isString,
} from '../utils/is.js'

/**
 * Serialize form data from object
 */
export function objectToFormData(
  obj: Record<string, unknown>,
  formData: FormData = new FormData(),
  parentKey = ''
): FormData {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key

    if (value === null || value === undefined) {
      continue
    }

    if (value instanceof File) {
      formData.append(fullKey, value, value.name)
    } else if (value instanceof Blob) {
      formData.append(fullKey, value)
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        if (item instanceof File) {
          formData.append(`${fullKey}[${i}]`, item, item.name)
        } else if (item instanceof Blob) {
          formData.append(`${fullKey}[${i}]`, item)
        } else if (typeof item === 'object' && item !== null) {
          objectToFormData(
            { [i]: item } as Record<string, unknown>,
            formData,
            fullKey
          )
        } else {
          formData.append(`${fullKey}[]`, String(item))
        }
      }
    } else if (isPlainObject(value)) {
      objectToFormData(value, formData, fullKey)
    } else {
      formData.append(fullKey, String(value))
    }
  }

  return formData
}

/**
 * Serialize object to URLSearchParams
 */
export function objectToURLSearchParams(obj: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          params.append(key, String(item))
        }
      }
    } else {
      params.append(key, String(value))
    }
  }

  return params
}

/**
 * Get content type for a body value
 */
export function getContentType(body: unknown): string | undefined {
  if (isFormData(body)) {
    // Let browser set multipart/form-data with boundary
    return undefined
  }

  if (isBlob(body)) {
    return body.type || 'application/octet-stream'
  }

  if (isURLSearchParams(body)) {
    return 'application/x-www-form-urlencoded;charset=UTF-8'
  }

  if (isArrayBuffer(body) || isArrayBufferView(body)) {
    return 'application/octet-stream'
  }

  if (isStream(body)) {
    return 'application/octet-stream'
  }

  if (isString(body)) {
    return 'text/plain;charset=UTF-8'
  }

  if (isPlainObject(body) || Array.isArray(body)) {
    return 'application/json;charset=UTF-8'
  }

  return undefined
}

/**
 * Serialize request body
 */
export function serializeBody(
  options: RequestOptions
): { body: BodyInit | undefined; contentType: string | undefined } {
  // Priority: json > form > body

  // Handle explicit JSON
  if (options.json !== undefined) {
    return {
      body: JSON.stringify(options.json),
      contentType: 'application/json;charset=UTF-8',
    }
  }

  // Handle form data
  if (options.form !== undefined) {
    if (isFormData(options.form)) {
      return {
        body: options.form,
        contentType: undefined, // Let browser set boundary
      }
    }

    // Check headers for content type hint
    const headers = options.headers
    let contentType: string | undefined

    if (headers) {
      if (headers instanceof Headers) {
        contentType = headers.get('content-type') ?? undefined
      } else if (Array.isArray(headers)) {
        const found = headers.find(([k]) => k.toLowerCase() === 'content-type')
        contentType = found?.[1]
      } else {
        for (const [key, value] of Object.entries(headers)) {
          if (key.toLowerCase() === 'content-type') {
            contentType = value
            break
          }
        }
      }
    }

    // If content-type is urlencoded, use URLSearchParams
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return {
        body: objectToURLSearchParams(options.form as Record<string, unknown>),
        contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
      }
    }

    // Default to FormData
    return {
      body: objectToFormData(options.form as Record<string, unknown>),
      contentType: undefined, // Let browser set boundary
    }
  }

  // Handle raw body
  if (options.body !== undefined) {
    const body = options.body

    // Already valid BodyInit types
    if (
      isFormData(body) ||
      isBlob(body) ||
      isArrayBuffer(body) ||
      isArrayBufferView(body) ||
      isURLSearchParams(body) ||
      isStream(body) ||
      isString(body)
    ) {
      return {
        body: body as BodyInit,
        contentType: getContentType(body),
      }
    }

    // Plain object - serialize as JSON
    if (isPlainObject(body) || Array.isArray(body)) {
      return {
        body: JSON.stringify(body),
        contentType: 'application/json;charset=UTF-8',
      }
    }

    // Unknown type - try to stringify
    return {
      body: String(body),
      contentType: 'text/plain;charset=UTF-8',
    }
  }

  return { body: undefined, contentType: undefined }
}

/**
 * Check if request should have a body
 */
export function shouldHaveBody(method: string): boolean {
  const upperMethod = method.toUpperCase()
  return upperMethod !== 'GET' && upperMethod !== 'HEAD'
}
