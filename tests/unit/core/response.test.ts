import { describe, it, expect } from 'vitest'
import {
  parseResponse,
  applyTransform,
  buildResponse,
  processResponse,
  isSuccessStatus,
  getResponseSize,
  cloneResponse,
} from '../../../src/core/response'
import type { InternalRequestConfig } from '../../../src/types'

const mockConfig: InternalRequestConfig = {
  url: '/test',
  method: 'GET',
  headers: new Headers(),
}

describe('Response Utilities', () => {
  describe('parseResponse', () => {
    it('should parse JSON response', async () => {
      const response = new Response(JSON.stringify({ name: 'test' }), {
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await parseResponse(response, 'json')
      expect(data).toEqual({ name: 'test' })
    })

    it('should parse text response', async () => {
      const response = new Response('Hello World')
      const data = await parseResponse(response, 'text')
      expect(data).toBe('Hello World')
    })

    it('should parse blob response', async () => {
      const response = new Response('blob content')
      const data = await parseResponse<Blob>(response, 'blob')
      // JSDOM's Blob class differs from native, check by duck typing
      expect(data).toBeDefined()
      expect(typeof (data as Blob).size).toBe('number')
      expect(typeof (data as Blob).type).toBe('string')
    })

    it('should parse arrayBuffer response', async () => {
      const response = new Response('buffer content')
      const data = await parseResponse<ArrayBuffer>(response, 'arrayBuffer')
      expect(data).toBeInstanceOf(ArrayBuffer)
    })

    it('should return stream for stream response', async () => {
      const response = new Response('stream content')
      const data = await parseResponse<ReadableStream>(response, 'stream')
      expect(data).toBeInstanceOf(ReadableStream)
    })

    it('should return response for raw response', async () => {
      const response = new Response('raw')
      const data = await parseResponse<Response>(response, 'raw')
      expect(data).toBe(response)
    })

    it('should return undefined for 204 response', async () => {
      const response = new Response(null, { status: 204 })
      const data = await parseResponse(response)
      expect(data).toBeUndefined()
    })

    it('should return undefined for 205 response', async () => {
      const response = new Response(null, { status: 205 })
      const data = await parseResponse(response)
      expect(data).toBeUndefined()
    })

    it('should return undefined for content-length: 0', async () => {
      const response = new Response('', {
        headers: { 'Content-Length': '0' },
      })
      const data = await parseResponse(response)
      expect(data).toBeUndefined()
    })

    it('should fallback to text for non-JSON content', async () => {
      const response = new Response('plain text', {
        headers: { 'Content-Type': 'text/plain' },
      })
      const data = await parseResponse(response)
      expect(data).toBe('plain text')
    })

    it('should handle invalid JSON gracefully', async () => {
      // Response with JSON content type but invalid JSON body
      const response = new Response('invalid json', {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await parseResponse(response)
      // Should fall back to returning the text content
      expect(data).toBe('invalid json')
    })
  })

  describe('applyTransform', () => {
    it('should apply single transform function', () => {
      const transform = (data: unknown) => ({ wrapped: data })
      const result = applyTransform({ a: 1 }, transform)
      expect(result).toEqual({ wrapped: { a: 1 } })
    })

    it('should apply multiple transform functions', () => {
      const transforms = [
        (data: unknown) => ({ first: data }),
        (data: unknown) => ({ second: data }),
      ]
      const result = applyTransform('test', transforms)
      expect(result).toEqual({ second: { first: 'test' } })
    })

    it('should pass headers to transform', () => {
      const headers = new Headers({ 'X-Custom': 'value' })
      const transform = (_data: unknown, h?: Headers) => h?.get('X-Custom')
      const result = applyTransform('test', transform, headers)
      expect(result).toBe('value')
    })

    it('should return data unchanged if no transform', () => {
      const result = applyTransform({ a: 1 }, undefined)
      expect(result).toEqual({ a: 1 })
    })
  })

  describe('buildResponse', () => {
    it('should build response object', () => {
      const response = new Response(null, { status: 200, statusText: 'OK' })
      const data = { name: 'test' }

      const result = buildResponse(data, response, mockConfig)

      expect(result).toEqual({
        data: { name: 'test' },
        status: 200,
        statusText: 'OK',
        headers: response.headers,
        config: mockConfig,
        request: undefined,
        ok: true,
      })
    })
  })

  describe('processResponse', () => {
    it('should process response and return data', async () => {
      const response = new Response(JSON.stringify({ name: 'test' }), {
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await processResponse(response, mockConfig)
      expect(data).toEqual({ name: 'test' })
    })

    it('should return full response when raw: true', async () => {
      const response = new Response(JSON.stringify({ name: 'test' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      })

      const config = { ...mockConfig, raw: true }
      const result = await processResponse(response, config)

      expect(result).toHaveProperty('data', { name: 'test' })
      expect(result).toHaveProperty('status', 200)
      expect(result).toHaveProperty('ok', true)
    })

    it('should apply transformResponse', async () => {
      const response = new Response(JSON.stringify({ name: 'test' }), {
        headers: { 'Content-Type': 'application/json' },
      })

      const config = {
        ...mockConfig,
        transformResponse: (data: unknown) => ({ transformed: data }),
      }

      const data = await processResponse(response, config)
      expect(data).toEqual({ transformed: { name: 'test' } })
    })
  })

  describe('isSuccessStatus', () => {
    it('should return true for 2xx status', () => {
      expect(isSuccessStatus(200)).toBe(true)
      expect(isSuccessStatus(201)).toBe(true)
      expect(isSuccessStatus(204)).toBe(true)
      expect(isSuccessStatus(299)).toBe(true)
    })

    it('should return false for non-2xx status', () => {
      expect(isSuccessStatus(100)).toBe(false)
      expect(isSuccessStatus(300)).toBe(false)
      expect(isSuccessStatus(400)).toBe(false)
      expect(isSuccessStatus(500)).toBe(false)
    })

    it('should use custom validateStatus', () => {
      const validateStatus = (status: number) => status < 400
      expect(isSuccessStatus(300, validateStatus)).toBe(true)
      expect(isSuccessStatus(400, validateStatus)).toBe(false)
    })
  })

  describe('getResponseSize', () => {
    it('should return content-length value', () => {
      const response = new Response('test', {
        headers: { 'Content-Length': '1024' },
      })
      expect(getResponseSize(response)).toBe(1024)
    })

    it('should return 0 if no content-length', () => {
      const response = new Response('test')
      expect(getResponseSize(response)).toBe(0)
    })
  })

  describe('cloneResponse', () => {
    it('should clone a response', async () => {
      const original = new Response('test body', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/plain' },
      })

      const cloned = cloneResponse(original)

      expect(cloned).not.toBe(original)
      expect(cloned.status).toBe(200)
      expect(cloned.statusText).toBe('OK')

      const text = await cloned.text()
      expect(text).toBe('test body')
    })
  })
})
