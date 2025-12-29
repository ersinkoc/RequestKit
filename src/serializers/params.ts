/**
 * Query parameter serialization utilities
 */

import type { ParamsSerializer } from '../types.js'
import { isArray, isDate, isPlainObject, isNullOrUndefined } from '../utils/is.js'

export type ArrayFormat = 'indices' | 'brackets' | 'repeat' | 'comma'

export interface SerializeOptions {
  arrayFormat?: ArrayFormat
  encode?: boolean
}

/**
 * Encode a value for URL
 */
function encode(value: string, shouldEncode = true): string {
  return shouldEncode ? encodeURIComponent(value) : value
}

/**
 * Convert a value to string for URL params
 */
function valueToString(value: unknown): string {
  if (isDate(value)) {
    return value.toISOString()
  }

  if (isPlainObject(value) || isArray(value)) {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Serialize an array value based on format
 */
function serializeArray(
  key: string,
  values: unknown[],
  format: ArrayFormat,
  shouldEncode: boolean
): string[] {
  const encodedKey = encode(key, shouldEncode)
  const result: string[] = []

  switch (format) {
    case 'indices':
      // key[0]=a&key[1]=b
      for (let i = 0; i < values.length; i++) {
        const value = values[i]
        if (!isNullOrUndefined(value)) {
          result.push(`${encodedKey}[${i}]=${encode(valueToString(value), shouldEncode)}`)
        }
      }
      break

    case 'brackets':
      // key[]=a&key[]=b
      for (const value of values) {
        if (!isNullOrUndefined(value)) {
          result.push(`${encodedKey}[]=${encode(valueToString(value), shouldEncode)}`)
        }
      }
      break

    case 'comma': {
      // key=a,b,c
      const nonNullValues = values.filter(v => !isNullOrUndefined(v))
      if (nonNullValues.length > 0) {
        const joined = nonNullValues.map(v => valueToString(v)).join(',')
        result.push(`${encodedKey}=${encode(joined, shouldEncode)}`)
      }
      break
    }

    case 'repeat':
    default:
      // key=a&key=b
      for (const value of values) {
        if (!isNullOrUndefined(value)) {
          result.push(`${encodedKey}=${encode(valueToString(value), shouldEncode)}`)
        }
      }
      break
  }

  return result
}

/**
 * Serialize params object to query string
 */
export function serializeParams(
  params: Record<string, unknown>,
  options: SerializeOptions = {}
): string {
  const { arrayFormat = 'repeat', encode: shouldEncode = true } = options
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (isNullOrUndefined(value)) {
      continue
    }

    if (isArray(value)) {
      parts.push(...serializeArray(key, value, arrayFormat, shouldEncode))
    } else {
      const encodedKey = encode(key, shouldEncode)
      const encodedValue = encode(valueToString(value), shouldEncode)
      parts.push(`${encodedKey}=${encodedValue}`)
    }
  }

  return parts.join('&')
}

/**
 * Parse query string to params object
 */
export function parseParams(query: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (!query) {
    return result
  }

  // Remove leading ? if present
  const cleanQuery = query.startsWith('?') ? query.slice(1) : query

  const params = new URLSearchParams(cleanQuery)

  for (const [key, value] of params.entries()) {
    // Check if key has array syntax
    const bracketMatch = key.match(/^(.+)\[\d*\]$/)
    const baseKey = bracketMatch ? bracketMatch[1] : key

    if (bracketMatch || params.getAll(key).length > 1) {
      // Handle as array
      if (baseKey) {
        const existingValue = result[baseKey]
        if (isArray(existingValue)) {
          existingValue.push(value)
        } else if (existingValue !== undefined) {
          result[baseKey] = [existingValue, value]
        } else {
          result[baseKey] = [value]
        }
      }
    } else {
      // Handle as single value
      const existing = result[key]
      if (existing !== undefined) {
        // Multiple values with same key become array
        if (isArray(existing)) {
          existing.push(value)
        } else {
          result[key] = [existing, value]
        }
      } else {
        result[key] = value
      }
    }
  }

  return result
}

/**
 * Create a params serializer with custom options
 */
export function createParamsSerializer(options: SerializeOptions = {}): ParamsSerializer {
  return {
    arrayFormat: options.arrayFormat ?? 'brackets',
    encode: (params: Record<string, unknown>) => serializeParams(params, options),
  }
}

/**
 * Apply params serializer to params object
 */
export function applyParamsSerializer(
  params: Record<string, unknown> | URLSearchParams,
  serializer?: ParamsSerializer
): string {
  if (params instanceof URLSearchParams) {
    return params.toString()
  }

  if (serializer?.encode) {
    return serializer.encode(params)
  }

  return serializeParams(params, {
    arrayFormat: serializer?.arrayFormat ?? 'repeat',
  })
}
