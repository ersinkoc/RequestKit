import { describe, it, expect } from 'vitest'
import {
  normalizeHeaders,
  mergeHeaders,
  parseHeaders,
  setHeaderIfMissing,
  getHeader,
  hasHeader,
  ContentTypes,
  isJSONContentType,
  isTextContentType,
} from '../../../src/serializers/headers'

describe('Headers Utilities', () => {
  describe('normalizeHeaders', () => {
    it('should handle Headers instance', () => {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      const normalized = normalizeHeaders(headers)
      expect(normalized.get('Content-Type')).toBe('application/json')
      expect(normalized).not.toBe(headers) // Should be cloned
    })

    it('should handle plain object', () => {
      const normalized = normalizeHeaders({ 'Content-Type': 'application/json' })
      expect(normalized.get('Content-Type')).toBe('application/json')
    })

    it('should handle array of tuples', () => {
      const normalized = normalizeHeaders([['Content-Type', 'application/json']])
      expect(normalized.get('Content-Type')).toBe('application/json')
    })

    it('should handle undefined', () => {
      const normalized = normalizeHeaders(undefined)
      expect(normalized).toBeInstanceOf(Headers)
    })

    it('should skip null and undefined values', () => {
      const normalized = normalizeHeaders({ 'Content-Type': null as any, 'Accept': 'application/json' })
      expect(normalized.has('Content-Type')).toBe(false)
      expect(normalized.get('Accept')).toBe('application/json')
    })

    it('should handle unknown HeadersInit type by passing to Headers constructor', () => {
      // Create a custom iterable that mimics HeadersInit
      const customHeaders = new Map([['Content-Type', 'application/json']])
      // Force the type to pretend it's a valid HeadersInit
      const normalized = normalizeHeaders(customHeaders as unknown as HeadersInit)
      expect(normalized).toBeInstanceOf(Headers)
    })
  })

  describe('mergeHeaders', () => {
    it('should merge multiple headers sources', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'text/plain' },
        { 'Authorization': 'Bearer token' },
        new Headers({ 'Accept': 'application/json' })
      )

      expect(merged.get('Content-Type')).toBe('text/plain')
      expect(merged.get('Authorization')).toBe('Bearer token')
      expect(merged.get('Accept')).toBe('application/json')
    })

    it('should override earlier values with later ones', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'text/plain' },
        { 'Content-Type': 'application/json' }
      )

      expect(merged.get('Content-Type')).toBe('application/json')
    })

    it('should remove headers with empty string value', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
        { 'Authorization': '' }
      )

      expect(merged.get('Content-Type')).toBe('application/json')
      expect(merged.has('Authorization')).toBe(false)
    })

    it('should handle undefined sources', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'application/json' },
        undefined,
        { 'Accept': 'text/plain' }
      )

      expect(merged.get('Content-Type')).toBe('application/json')
      expect(merged.get('Accept')).toBe('text/plain')
    })
  })

  describe('parseHeaders', () => {
    it('should convert Headers to plain object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      })

      const parsed = parseHeaders(headers)

      expect(parsed).toEqual({
        'content-type': 'application/json',
        'accept': 'text/plain',
      })
    })
  })

  describe('setHeaderIfMissing', () => {
    it('should set header if not present', () => {
      const headers = new Headers()
      setHeaderIfMissing(headers, 'Content-Type', 'application/json')
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('should not override existing header', () => {
      const headers = new Headers({ 'Content-Type': 'text/plain' })
      setHeaderIfMissing(headers, 'Content-Type', 'application/json')
      expect(headers.get('Content-Type')).toBe('text/plain')
    })
  })

  describe('getHeader', () => {
    it('should get header from Headers instance', () => {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      expect(getHeader(headers, 'Content-Type')).toBe('application/json')
      expect(getHeader(headers, 'content-type')).toBe('application/json')
    })

    it('should get header from plain object (case-insensitive)', () => {
      const headers = { 'Content-Type': 'application/json' }
      expect(getHeader(headers, 'content-type')).toBe('application/json')
    })

    it('should get header from array of tuples', () => {
      const headers: [string, string][] = [['Content-Type', 'application/json']]
      expect(getHeader(headers, 'content-type')).toBe('application/json')
    })

    it('should return undefined for missing header', () => {
      const headers = new Headers()
      expect(getHeader(headers, 'Content-Type')).toBeUndefined()
    })

    it('should return undefined for undefined headers', () => {
      expect(getHeader(undefined, 'Content-Type')).toBeUndefined()
    })

    it('should return undefined when header is not found in plain object', () => {
      const headers = { 'Accept': 'application/json' }
      expect(getHeader(headers, 'Content-Type')).toBeUndefined()
    })

    it('should return undefined for unknown header type', () => {
      // Create a value that is not Headers, not Array, and not PlainObject
      const headers = new Map([['Content-Type', 'application/json']])
      expect(getHeader(headers as unknown as Record<string, string>, 'Content-Type')).toBeUndefined()
    })
  })

  describe('hasHeader', () => {
    it('should return true if header exists', () => {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      expect(hasHeader(headers, 'Content-Type')).toBe(true)
      expect(hasHeader(headers, 'content-type')).toBe(true)
    })

    it('should return false if header does not exist', () => {
      const headers = new Headers()
      expect(hasHeader(headers, 'Content-Type')).toBe(false)
    })
  })

  describe('ContentTypes', () => {
    it('should have correct content type values', () => {
      expect(ContentTypes.JSON).toBe('application/json')
      expect(ContentTypes.FORM).toBe('application/x-www-form-urlencoded')
      expect(ContentTypes.MULTIPART).toBe('multipart/form-data')
      expect(ContentTypes.TEXT).toBe('text/plain')
      expect(ContentTypes.HTML).toBe('text/html')
      expect(ContentTypes.XML).toBe('application/xml')
      expect(ContentTypes.OCTET_STREAM).toBe('application/octet-stream')
    })
  })

  describe('isJSONContentType', () => {
    it('should return true for JSON content types', () => {
      expect(isJSONContentType('application/json')).toBe(true)
      expect(isJSONContentType('application/json; charset=utf-8')).toBe(true)
      expect(isJSONContentType('application/vnd.api+json')).toBe(true)
    })

    it('should return false for non-JSON content types', () => {
      expect(isJSONContentType('text/plain')).toBe(false)
      expect(isJSONContentType('text/html')).toBe(false)
      expect(isJSONContentType(null)).toBe(false)
      expect(isJSONContentType(undefined)).toBe(false)
    })
  })

  describe('isTextContentType', () => {
    it('should return true for text content types', () => {
      expect(isTextContentType('text/plain')).toBe(true)
      expect(isTextContentType('text/html')).toBe(true)
      expect(isTextContentType('text/css')).toBe(true)
      expect(isTextContentType('application/json')).toBe(true)
      expect(isTextContentType('application/xml')).toBe(true)
      expect(isTextContentType('application/svg+xml')).toBe(true)
    })

    it('should return false for binary content types', () => {
      expect(isTextContentType('application/octet-stream')).toBe(false)
      expect(isTextContentType('image/png')).toBe(false)
      expect(isTextContentType(null)).toBe(false)
      expect(isTextContentType(undefined)).toBe(false)
    })
  })
})
