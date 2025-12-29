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

  describe('Request Interceptor Error Recovery', () => {
    it('should recover from error with rejected handler returning config', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('Interceptor failed')
        },
        (error) => {
          // Return a recovered config
          return { ...error.config, url: 'https://api.example.com/recovered' } as any
        }
      )

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toBe('https://api.example.com/recovered')
    })

    it('should recover from error with async rejected handler', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('Interceptor failed')
        },
        async (error) => {
          await new Promise((r) => setTimeout(r, 10))
          return { ...error.config, url: 'https://api.example.com/async-recovered' } as any
        }
      )

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toBe('https://api.example.com/async-recovered')
    })

    it('should throw when rejected handler also throws', async () => {
      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('First error')
        },
        () => {
          throw new Error('Second error')
        }
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })

    it('should throw when rejected handler returns non-config value', async () => {
      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('Interceptor failed')
        },
        () => {
          return 'not a config'
        }
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })
  })

  describe('Response Interceptor Error Recovery', () => {
    it('should recover from response error with Response object', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.response.use(
        () => {
          throw new Error('Response interceptor failed')
        },
        () => {
          // Return a new Response to recover
          return new Response(JSON.stringify({ recovered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ recovered: true })
    })

    it('should recover from response error with async Response', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.response.use(
        () => {
          throw new Error('Response interceptor failed')
        },
        async () => {
          await new Promise((r) => setTimeout(r, 10))
          return new Response(JSON.stringify({ asyncRecovered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ asyncRecovered: true })
    })

    it('should throw when response rejected handler also throws', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.response.use(
        () => {
          throw new Error('First error')
        },
        () => {
          throw new Error('Second error from rejected')
        }
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow('Second error from rejected')
    })

    it('should throw when response rejected handler returns non-Response', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()

      client.interceptors.response.use(
        () => {
          throw new Error('Response interceptor failed')
        },
        () => {
          return 'not a response'
        }
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })
  })

  describe('Error Interceptor Handling', () => {
    it('should handle error interceptor that returns Response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        () => {
          return new Response(JSON.stringify({ fallback: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ fallback: true })
    })

    it('should handle async error interceptor that returns Response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        async () => {
          await new Promise((r) => setTimeout(r, 10))
          return new Response(JSON.stringify({ asyncFallback: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ asyncFallback: true })
    })

    it('should propagate error when no interceptor returns Response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        (error) => {
          // Don't return a Response, just throw
          throw error
        }
      )

      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })

    it('should update error when rejected handler throws new error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        () => {
          throw new Error('Custom error from interceptor')
        }
      )

      // The original 500 error is thrown first, then interceptor catches and re-throws
      await expect(client.get('https://api.example.com/test')).rejects.toThrow()
    })

    it('should preserve RequestError when rejected handler throws it', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        (error) => {
          // Re-throw the original RequestError
          throw error
        }
      )

      try {
        await client.get('https://api.example.com/test')
      } catch (error: unknown) {
        // Should be a RequestError with expected properties
        expect((error as { name: string }).name).toBe('RequestError')
        expect((error as { status: number }).status).toBe(500)
      }
    })
  })

  describe('Request Interceptor RequestError Handling', () => {
    it('should preserve RequestError when request rejected handler throws it', async () => {
      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('First error')
        },
        (error) => {
          // Throw the original RequestError (error is already a RequestError)
          throw error
        }
      )

      try {
        await client.get('https://api.example.com/test')
      } catch (error: unknown) {
        // Should be a RequestError
        expect((error as { name: string }).name).toBe('RequestError')
      }
    })

    it('should wrap non-RequestError thrown by rejected handler', async () => {
      const client = createClient()

      client.interceptors.request.use(
        () => {
          throw new Error('First error')
        },
        () => {
          // Throw a plain Error from rejected handler
          throw new Error('From rejected handler')
        }
      )

      try {
        await client.get('https://api.example.com/test')
      } catch (error: unknown) {
        // Should be wrapped in a RequestError
        expect((error as { name: string }).name).toBe('RequestError')
        expect((error as { message: string }).message).toBe('From rejected handler')
      }
    })
  })
})
