import { describe, it, expect } from 'vitest'
import {
  buildFullURL,
  applyRequestTransform,
  mergeConfig,
  prepareRequest,
  DEFAULT_CONFIG,
} from '../../../src/core/request'
import type { InternalRequestConfig, ClientConfig } from '../../../src/types'

describe('Request Core', () => {
  describe('buildFullURL', () => {
    it('should build URL with baseURL', () => {
      const config: InternalRequestConfig = {
        url: '/users',
        baseURL: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
      }
      expect(buildFullURL(config)).toBe('https://api.example.com/users')
    })

    it('should not use baseURL for absolute URLs', () => {
      const config: InternalRequestConfig = {
        url: 'https://other.com/users',
        baseURL: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
      }
      expect(buildFullURL(config)).toBe('https://other.com/users')
    })

    it('should add query params', () => {
      const config: InternalRequestConfig = {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: new Headers(),
        params: { page: 1, limit: 10 },
      }
      expect(buildFullURL(config)).toBe('https://api.example.com/users?page=1&limit=10')
    })
  })

  describe('applyRequestTransform', () => {
    it('should return data unchanged when no transforms', () => {
      const data = { name: 'test' }
      const headers = new Headers()
      expect(applyRequestTransform(data, undefined, headers)).toBe(data)
    })

    it('should apply single transform function', () => {
      const data = { name: 'test' }
      const headers = new Headers()
      const transform = (d: unknown) => ({ ...(d as object), modified: true })

      const result = applyRequestTransform(data, transform, headers)
      expect(result).toEqual({ name: 'test', modified: true })
    })

    it('should apply array of transform functions', () => {
      const data = { count: 1 }
      const headers = new Headers()
      const transforms = [
        (d: unknown) => ({ ...(d as object), step1: true }),
        (d: unknown) => ({ ...(d as object), step2: true }),
      ]

      const result = applyRequestTransform(data, transforms, headers)
      expect(result).toEqual({ count: 1, step1: true, step2: true })
    })

    it('should skip non-function transforms', () => {
      const data = { name: 'test' }
      const headers = new Headers()
      const transforms = [
        'not a function' as unknown as (d: unknown) => unknown,
        (d: unknown) => ({ ...(d as object), modified: true }),
      ]

      const result = applyRequestTransform(data, transforms, headers)
      expect(result).toEqual({ name: 'test', modified: true })
    })
  })

  describe('mergeConfig', () => {
    it('should merge defaults with options', () => {
      const defaults: ClientConfig = {
        baseURL: 'https://api.example.com',
        headers: { 'X-Custom': 'value' },
      }
      const options = { url: '/users', method: 'POST' as const }

      const result = mergeConfig(defaults, options)

      expect(result.url).toBe('/users')
      expect(result.method).toBe('POST')
      expect(result.baseURL).toBe('https://api.example.com')
      expect(result.headers.get('X-Custom')).toBe('value')
    })

    it('should use default method GET', () => {
      const result = mergeConfig({}, { url: '/test' })
      expect(result.method).toBe('GET')
    })

    it('should uppercase method', () => {
      const result = mergeConfig({}, { url: '/test', method: 'post' as 'POST' })
      expect(result.method).toBe('POST')
    })
  })

  describe('prepareRequest', () => {
    it('should create Request object', () => {
      const config: InternalRequestConfig = {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: new Headers({ 'Accept': 'application/json' }),
      }

      const request = prepareRequest(config)

      expect(request).toBeInstanceOf(Request)
      expect(request.url).toBe('https://api.example.com/users')
      expect(request.method).toBe('GET')
      expect(request.headers.get('Accept')).toBe('application/json')
    })

    it('should serialize JSON body', () => {
      const config: InternalRequestConfig = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: new Headers(),
        json: { name: 'test' },
      }

      const request = prepareRequest(config)

      expect(request.headers.get('Content-Type')).toBe('application/json;charset=UTF-8')
    })

    it('should apply transformRequest to object body', async () => {
      const config: InternalRequestConfig = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: new Headers(),
        json: { name: 'original' },
        transformRequest: (data) => ({ ...(data as object), transformed: true }),
      }

      const request = prepareRequest(config)
      const body = await request.text()

      expect(JSON.parse(body)).toEqual({ name: 'original', transformed: true })
    })

    it('should handle non-object transformed result', async () => {
      const config: InternalRequestConfig = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: new Headers(),
        json: { name: 'test' },
        transformRequest: () => 'custom string', // Returns non-object
      }

      const request = prepareRequest(config)
      const body = await request.text()

      // Since transform returns non-object, original serialized body is used
      expect(body).toBe(JSON.stringify({ name: 'test' }))
    })
  })

  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.timeout).toBe(0)
      expect(DEFAULT_CONFIG.responseType).toBe('json')
      expect(DEFAULT_CONFIG.validateStatus?.(200)).toBe(true)
      expect(DEFAULT_CONFIG.validateStatus?.(299)).toBe(true)
      expect(DEFAULT_CONFIG.validateStatus?.(300)).toBe(false)
      expect(DEFAULT_CONFIG.validateStatus?.(199)).toBe(false)
    })
  })
})
