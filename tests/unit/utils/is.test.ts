import { describe, it, expect } from 'vitest'
import {
  isFormData,
  isBlob,
  isFile,
  isArrayBuffer,
  isArrayBufferView,
  isURLSearchParams,
  isStream,
  isPlainObject,
  isFunction,
  isString,
  isNumber,
  isUndefined,
  isNullOrUndefined,
  isDate,
  isBoolean,
  isArray,
  isObject,
  isHeaders,
  isRequest,
  isResponse,
  isAbortSignal,
} from '../../../src/utils/is'

describe('Type Guards', () => {
  describe('isFormData', () => {
    it('should return true for FormData', () => {
      expect(isFormData(new FormData())).toBe(true)
    })

    it('should return false for non-FormData', () => {
      expect(isFormData({})).toBe(false)
      expect(isFormData(null)).toBe(false)
      expect(isFormData('string')).toBe(false)
    })
  })

  describe('isBlob', () => {
    it('should return true for Blob', () => {
      expect(isBlob(new Blob(['test']))).toBe(true)
    })

    it('should return false for non-Blob', () => {
      expect(isBlob({})).toBe(false)
      expect(isBlob(null)).toBe(false)
    })
  })

  describe('isFile', () => {
    it('should return true for File', () => {
      const file = new File(['test'], 'test.txt')
      expect(isFile(file)).toBe(true)
    })

    it('should return false for non-File', () => {
      expect(isFile(new Blob(['test']))).toBe(false)
      expect(isFile({})).toBe(false)
    })
  })

  describe('isArrayBuffer', () => {
    it('should return true for ArrayBuffer', () => {
      expect(isArrayBuffer(new ArrayBuffer(8))).toBe(true)
    })

    it('should return false for non-ArrayBuffer', () => {
      expect(isArrayBuffer(new Uint8Array(8))).toBe(false)
      expect(isArrayBuffer({})).toBe(false)
    })
  })

  describe('isArrayBufferView', () => {
    it('should return true for TypedArrays', () => {
      expect(isArrayBufferView(new Uint8Array(8))).toBe(true)
      expect(isArrayBufferView(new Int32Array(4))).toBe(true)
      expect(isArrayBufferView(new DataView(new ArrayBuffer(8)))).toBe(true)
    })

    it('should return false for ArrayBuffer and others', () => {
      expect(isArrayBufferView(new ArrayBuffer(8))).toBe(false)
      expect(isArrayBufferView({})).toBe(false)
    })
  })

  describe('isURLSearchParams', () => {
    it('should return true for URLSearchParams', () => {
      expect(isURLSearchParams(new URLSearchParams())).toBe(true)
    })

    it('should return false for non-URLSearchParams', () => {
      expect(isURLSearchParams('a=1&b=2')).toBe(false)
      expect(isURLSearchParams({})).toBe(false)
    })
  })

  describe('isStream', () => {
    it('should return true for ReadableStream', () => {
      const stream = new ReadableStream()
      expect(isStream(stream)).toBe(true)
    })

    it('should return false for non-ReadableStream', () => {
      expect(isStream({})).toBe(false)
      expect(isStream(null)).toBe(false)
    })
  })

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true)
      expect(isPlainObject({ a: 1 })).toBe(true)
      expect(isPlainObject(Object.create(null))).toBe(true)
    })

    it('should return false for non-plain objects', () => {
      expect(isPlainObject([])).toBe(false)
      expect(isPlainObject(null)).toBe(false)
      expect(isPlainObject(new Date())).toBe(false)
      expect(isPlainObject(new Map())).toBe(false)
      expect(isPlainObject('string')).toBe(false)
    })
  })

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true)
      expect(isFunction(function () {})).toBe(true)
      expect(isFunction(async () => {})).toBe(true)
    })

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false)
      expect(isFunction(null)).toBe(false)
    })
  })

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true)
      expect(isString('hello')).toBe(true)
    })

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString(null)).toBe(false)
    })
  })

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true)
      expect(isNumber(42)).toBe(true)
      expect(isNumber(-1.5)).toBe(true)
    })

    it('should return false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false)
      expect(isNumber('42')).toBe(false)
      expect(isNumber(null)).toBe(false)
    })
  })

  describe('isUndefined', () => {
    it('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true)
    })

    it('should return false for defined values', () => {
      expect(isUndefined(null)).toBe(false)
      expect(isUndefined('')).toBe(false)
      expect(isUndefined(0)).toBe(false)
    })
  })

  describe('isNullOrUndefined', () => {
    it('should return true for null or undefined', () => {
      expect(isNullOrUndefined(null)).toBe(true)
      expect(isNullOrUndefined(undefined)).toBe(true)
    })

    it('should return false for other values', () => {
      expect(isNullOrUndefined('')).toBe(false)
      expect(isNullOrUndefined(0)).toBe(false)
      expect(isNullOrUndefined(false)).toBe(false)
    })
  })

  describe('isDate', () => {
    it('should return true for valid dates', () => {
      expect(isDate(new Date())).toBe(true)
      expect(isDate(new Date('2024-01-01'))).toBe(true)
    })

    it('should return false for invalid dates and non-dates', () => {
      expect(isDate(new Date('invalid'))).toBe(false)
      expect(isDate('2024-01-01')).toBe(false)
      expect(isDate(null)).toBe(false)
    })
  })

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true)
      expect(isBoolean(false)).toBe(true)
    })

    it('should return false for non-booleans', () => {
      expect(isBoolean(0)).toBe(false)
      expect(isBoolean('')).toBe(false)
      expect(isBoolean(null)).toBe(false)
    })
  })

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
    })

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('array')).toBe(false)
    })
  })

  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject([])).toBe(true)
      expect(isObject(new Date())).toBe(true)
    })

    it('should return false for null and primitives', () => {
      expect(isObject(null)).toBe(false)
      expect(isObject('string')).toBe(false)
      expect(isObject(42)).toBe(false)
    })
  })

  describe('isHeaders', () => {
    it('should return true for Headers', () => {
      expect(isHeaders(new Headers())).toBe(true)
    })

    it('should return false for non-Headers', () => {
      expect(isHeaders({})).toBe(false)
      expect(isHeaders(null)).toBe(false)
    })
  })

  describe('isRequest', () => {
    it('should return true for Request', () => {
      expect(isRequest(new Request('https://example.com'))).toBe(true)
    })

    it('should return false for non-Request', () => {
      expect(isRequest({})).toBe(false)
      expect(isRequest('https://example.com')).toBe(false)
    })
  })

  describe('isResponse', () => {
    it('should return true for Response', () => {
      expect(isResponse(new Response())).toBe(true)
    })

    it('should return false for non-Response', () => {
      expect(isResponse({})).toBe(false)
      expect(isResponse(null)).toBe(false)
    })
  })

  describe('isAbortSignal', () => {
    it('should return true for AbortSignal', () => {
      const controller = new AbortController()
      expect(isAbortSignal(controller.signal)).toBe(true)
    })

    it('should return false for non-AbortSignal', () => {
      expect(isAbortSignal({})).toBe(false)
      expect(isAbortSignal(null)).toBe(false)
    })
  })
})
