/**
 * Deep merge utilities
 */

import { isPlainObject, isArray } from './is.js'

/**
 * Deep merge multiple objects
 * Later sources override earlier ones
 * Arrays are replaced, not merged
 */
export function deepMerge<T>(
  ...sources: Array<Partial<T> | undefined>
): T {
  const result: Record<string, unknown> = {}

  for (const source of sources) {
    if (!source) {
      continue
    }

    for (const key of Object.keys(source)) {
      const sourceValue = (source as Record<string, unknown>)[key]
      const targetValue = result[key]

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        // Deep merge objects
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        )
      } else if (sourceValue !== undefined) {
        // Replace value (arrays are replaced, not merged)
        result[key] = isArray(sourceValue) ? [...sourceValue] : sourceValue
      }
    }
  }

  return result as T
}

/**
 * Shallow merge multiple objects
 * Later sources override earlier ones
 */
export function shallowMerge<T extends Record<string, unknown>>(
  ...sources: Array<Partial<T> | undefined>
): T {
  const result: Record<string, unknown> = {}

  for (const source of sources) {
    if (!source) {
      continue
    }

    for (const key of Object.keys(source)) {
      const value = source[key]
      if (value !== undefined) {
        result[key] = value
      }
    }
  }

  return result as T
}

/**
 * Clone an object deeply
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (isArray(value)) {
    return value.map(item => deepClone(item)) as T
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  if (value instanceof Map) {
    const result = new Map()
    value.forEach((v, k) => result.set(deepClone(k), deepClone(v)))
    return result as T
  }

  if (value instanceof Set) {
    const result = new Set()
    value.forEach(v => result.add(deepClone(v)))
    return result as T
  }

  // Handle Headers specially
  if (typeof Headers !== 'undefined' && value instanceof Headers) {
    const result = new Headers()
    value.forEach((v, k) => result.set(k, v))
    return result as T
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      result[key] = deepClone((value as Record<string, unknown>)[key])
    }
    return result as T
  }

  // For other objects, return as-is (class instances, etc.)
  return value
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }

  for (const key of keys) {
    delete result[key]
  }

  return result
}
