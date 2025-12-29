import { describe, it, expect } from 'vitest'
import {
  isAbsoluteURL,
  combineURLs,
  buildURL,
  parseURL,
  getOrigin,
  isSameOrigin,
} from '../../../src/utils/url'

describe('URL Utilities', () => {
  describe('isAbsoluteURL', () => {
    it('should return true for absolute URLs', () => {
      expect(isAbsoluteURL('https://example.com')).toBe(true)
      expect(isAbsoluteURL('http://example.com')).toBe(true)
      expect(isAbsoluteURL('//example.com')).toBe(true)
      expect(isAbsoluteURL('ftp://example.com')).toBe(true)
    })

    it('should return false for relative URLs', () => {
      expect(isAbsoluteURL('/users')).toBe(false)
      expect(isAbsoluteURL('users')).toBe(false)
      expect(isAbsoluteURL('./users')).toBe(false)
      expect(isAbsoluteURL('../users')).toBe(false)
    })
  })

  describe('combineURLs', () => {
    it('should combine base URL and relative URL', () => {
      expect(combineURLs('https://api.example.com', '/users')).toBe('https://api.example.com/users')
      expect(combineURLs('https://api.example.com/', '/users')).toBe('https://api.example.com/users')
      expect(combineURLs('https://api.example.com', 'users')).toBe('https://api.example.com/users')
      expect(combineURLs('https://api.example.com/', 'users')).toBe('https://api.example.com/users')
    })

    it('should handle empty base URL', () => {
      expect(combineURLs('', '/users')).toBe('/users')
    })

    it('should handle empty relative URL', () => {
      expect(combineURLs('https://api.example.com', '')).toBe('https://api.example.com')
    })

    it('should return relative URL if it is absolute', () => {
      expect(combineURLs('https://api.example.com', 'https://other.com/users')).toBe('https://other.com/users')
    })
  })

  describe('buildURL', () => {
    it('should append query params to URL', () => {
      expect(buildURL('/users', { page: 1, limit: 20 })).toBe('/users?page=1&limit=20')
    })

    it('should handle URL with existing query string', () => {
      expect(buildURL('/users?sort=name', { page: 1 })).toBe('/users?sort=name&page=1')
    })

    it('should handle URLSearchParams', () => {
      const params = new URLSearchParams()
      params.append('a', '1')
      params.append('b', '2')
      expect(buildURL('/users', params)).toBe('/users?a=1&b=2')
    })

    it('should handle string params', () => {
      expect(buildURL('/users', 'page=1&limit=20')).toBe('/users?page=1&limit=20')
    })

    it('should handle null and undefined values', () => {
      expect(buildURL('/users', { a: 1, b: null, c: undefined })).toBe('/users?a=1')
    })

    it('should handle arrays', () => {
      expect(buildURL('/users', { tags: ['a', 'b', 'c'] })).toBe('/users?tags=a&tags=b&tags=c')
    })

    it('should handle dates', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      expect(buildURL('/users', { date })).toBe('/users?date=2024-01-01T00%3A00%3A00.000Z')
    })

    it('should handle objects by JSON stringifying', () => {
      expect(buildURL('/users', { filter: { status: 'active' } })).toBe('/users?filter=%7B%22status%22%3A%22active%22%7D')
    })

    it('should preserve hash', () => {
      expect(buildURL('/users#section', { page: 1 })).toBe('/users?page=1#section')
    })

    it('should return URL unchanged if no params', () => {
      expect(buildURL('/users')).toBe('/users')
      expect(buildURL('/users', undefined)).toBe('/users')
      expect(buildURL('/users', {})).toBe('/users')
    })
  })

  describe('parseURL', () => {
    it('should parse absolute URL', () => {
      const result = parseURL('https://example.com:8080/path?query=1#hash')
      expect(result.protocol).toBe('https:')
      expect(result.host).toBe('example.com:8080')
      expect(result.pathname).toBe('/path')
      expect(result.search).toBe('?query=1')
      expect(result.hash).toBe('#hash')
    })

    it('should handle relative URL', () => {
      const result = parseURL('/path')
      expect(result.pathname).toBe('/path')
    })
  })

  describe('getOrigin', () => {
    it('should return origin from URL', () => {
      expect(getOrigin('https://example.com/path')).toBe('https://example.com')
      expect(getOrigin('https://example.com:8080/path')).toBe('https://example.com:8080')
    })

    it('should return empty string for invalid URL', () => {
      expect(getOrigin('invalid')).toBe('')
    })
  })

  describe('isSameOrigin', () => {
    it('should return true for same origin', () => {
      expect(isSameOrigin('https://example.com/a', 'https://example.com/b')).toBe(true)
    })

    it('should return false for different origin', () => {
      expect(isSameOrigin('https://example.com', 'https://other.com')).toBe(false)
      expect(isSameOrigin('https://example.com', 'http://example.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isSameOrigin('invalid', 'https://example.com')).toBe(false)
    })
  })
})
