import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '../../src/core/client'
import { mockFetch } from '../setup'

describe('Interceptors Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('Request Interceptors', () => {
    it('should modify request config', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.request.use((config) => {
        config.headers.set('Authorization', 'Bearer token123')
        return config
      })

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('Authorization')).toBe('Bearer token123')
    })

    it('should execute interceptors in order', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()
      const order: number[] = []

      client.interceptors.request.use((config) => {
        order.push(1)
        return config
      })

      client.interceptors.request.use((config) => {
        order.push(2)
        return config
      })

      client.interceptors.request.use((config) => {
        order.push(3)
        return config
      })

      await client.get('https://api.example.com/test')

      expect(order).toEqual([1, 2, 3])
    })

    it('should handle async interceptors', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.request.use(async (config) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        config.headers.set('X-Async', 'true')
        return config
      })

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Async')).toBe('true')
    })

    it('should handle interceptor errors', async () => {
      const client = createClient()

      client.interceptors.request.use(() => {
        throw new Error('Interceptor error')
      })

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })

    it('should eject interceptor', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response('{}'))
        .mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      const id = client.interceptors.request.use((config) => {
        config.headers.set('X-Test', 'value')
        return config
      })

      // First request should have header
      await client.get('https://api.example.com/test')
      let request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Test')).toBe('value')

      // Eject interceptor
      client.interceptors.request.eject(id)

      // Second request should not have header
      await client.get('https://api.example.com/test')
      request = mockFetch.mock.calls[1]?.[0] as Request
      expect(request.headers.get('X-Test')).toBeNull()
    })
  })

  describe('Response Interceptors', () => {
    it('should modify response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'original' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()

      client.interceptors.response.use((response) => {
        // Add custom header to response
        const headers = new Headers(response.headers)
        headers.set('X-Intercepted', 'true')

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      })

      const data = await client.get('https://api.example.com/test', { raw: true })
      expect(data.headers.get('X-Intercepted')).toBe('true')
    })

    it('should execute interceptors in reverse order', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()
      const order: number[] = []

      client.interceptors.response.use((response) => {
        order.push(1)
        return response
      })

      client.interceptors.response.use((response) => {
        order.push(2)
        return response
      })

      client.interceptors.response.use((response) => {
        order.push(3)
        return response
      })

      await client.get('https://api.example.com/test')

      // Response interceptors run in reverse order
      expect(order).toEqual([3, 2, 1])
    })

    it('should handle response errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 401, statusText: 'Unauthorized' })
      )

      const client = createClient()
      const errorHandler = vi.fn((error) => {
        throw error
      })

      client.interceptors.response.use(
        (response) => response,
        errorHandler
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
      expect(errorHandler).toHaveBeenCalled()
    })

    it('should allow error recovery', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response('{}', { status: 401 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ recovered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        async (error) => {
          if (error.status === 401) {
            // Retry the request
            return fetch(error.config.url)
          }
          throw error
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ recovered: true })
    })
  })

  describe('Clear Interceptors', () => {
    it('should clear all request interceptors', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const client = createClient()

      client.interceptors.request.use((config) => {
        config.headers.set('X-Test1', 'value1')
        return config
      })

      client.interceptors.request.use((config) => {
        config.headers.set('X-Test2', 'value2')
        return config
      })

      client.interceptors.request.clear()

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Test1')).toBeNull()
      expect(request.headers.get('X-Test2')).toBeNull()
    })

    it('should clear all response interceptors', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const client = createClient()
      const called = vi.fn()

      client.interceptors.response.use((response) => {
        called()
        return response
      })

      client.interceptors.response.clear()

      await client.get('https://api.example.com/test')

      expect(called).not.toHaveBeenCalled()
    })
  })

  describe('Interceptor Inheritance', () => {
    it('should copy interceptors when extending', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const base = createClient()
      base.interceptors.request.use((config) => {
        config.headers.set('X-Base', 'true')
        return config
      })

      const extended = base.extend({})

      // Extended should have base interceptor
      await extended.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Base')).toBe('true')
    })

    it('should copy interceptors when cloning', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const original = createClient()
      original.interceptors.request.use((config) => {
        config.headers.set('X-Original', 'true')
        return config
      })

      const cloned = original.clone()

      await cloned.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Original')).toBe('true')
    })
  })
})
